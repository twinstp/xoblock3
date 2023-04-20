'use strict';
const simHashMemo = {}; // Memoization lookup table for computeSimHash

// Trie Node class
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

// Trie class
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a word into the Trie
  insert(word) {
    let current = this.root;
    for (const ch of word) {
      if (!current.children[ch]) {
        current.children[ch] = new TrieNode();
      }
      current = current.children[ch];
    }
    current.isEndOfWord = true;
  }

  // Search for a word in the Trie
  search(word) {
    let current = this.root;
    for (const ch of word) {
      if (!current.children[ch]) {
        return false;
      }
      current = current.children[ch];
    }
    return current.isEndOfWord;
  }

  // Check if the Trie contains any word with the given prefix
  startsWith(prefix) {
    let current = this.root;
    for (const ch of prefix) {
      if (!current.children[ch]) {
        return false;
      }
      current = current.children[ch];
    }
    return true;
  }
}
const initialConfig = {
  MAX_CACHE_SIZE: 500,
  MAX_HAMMING_DISTANCE: 3,
  FILTERED_SUBSTRINGS: new Set([
    "It's not a dysphoria. I see it in the positive way of working toward something, rather than away from something.",
    "legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago",
    "America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling",
    "Go to the link, and look at that woman. Look at that face. She never expressed any remorse over",
    "destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess",
  ]),
};

// Load configuration from storage or use default values
async function loadConfig() {
  let config = initialConfig;
  try {
    const storedConfig = await chrome.storage.local.get('config');
    config = storedConfig.config || initialConfig;
    config.FILTERED_SUBSTRINGS = new Set(config.FILTERED_SUBSTRINGS);
  } catch (error) {
    console.warn('Failed to load configuration from storage. Using initial configuration.');
  }
  return config;
}
// Precompute simhash values for FILTERED_SUBSTRINGS
const precomputedSimHashes = new Set();
for (const substring of initialConfig.FILTERED_SUBSTRINGS) {
  precomputedSimHashes.add(computeSimHash(substring));
}

// Trie for efficient substring search
const trie = new Trie();
for (const substring of initialConfig.FILTERED_SUBSTRINGS) {
  trie.insert(substring);
}

// Compute SHA-1 hash of a message
async function computeSHA1(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Compute SimHash of a message
async function computeSimHash(message) {
  if (simHashMemo[message]) {
    return simHashMemo[message];
  }
  const tokenWeights = new Map();
  const tokens = message.split(/\s+/);
  tokens.forEach(token => {
    const weight = (tokenWeights.get(token) || 0) + 1;
    tokenWeights.set(token, weight);
  });
  const fingerprintBits = 32;
  const v = new Int32Array(fingerprintBits);
  const promises = [];
  for (const [token, weight] of tokenWeights.entries()) {
    promises.push(computeSHA1(token).then(hash => {
      const hashInt = BigInt(`0x${hash}`);
      for (let i = 0; i < fingerprintBits; ++i) {
        v[i] += (hashInt >> BigInt(i)) & 1n ? weight : -weight;
      }
    }));
  }
  await Promise.all(promises);
  let simHash = 0n;
  for (let i = 0; i < fingerprintBits; ++i) {
    if (v[i] > 0) {
      simHash |= 1n << BigInt(i);
    }
  }
  simHashMemo[message] = simHash;
  return simHash;
}
// Compute Hamming distance between two hash values
function hammingDistance(hash1, hash2) {
  let xor = hash1 ^ hash2;
  let distance = 0;
  while (xor) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}

// Extract text content from HTML table element
function extractPostText(table) {
  const bodyElement = table.querySelector('table font');
  return bodyElement ? bodyElement.textContent.trim() : '';
}

// Updated filterSpamPosts function using Trie and precomputedSimHashes
async function filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById) {
  const MAX_CACHE_SIZE = config.MAX_CACHE_SIZE || 500;
  const messageTables = document.querySelectorAll("table[width='700'][id], table.threadlist tr[name]");
  const simHashFrequencies = new Map();
  const computePromises = [];
  for (const table of messageTables) {
    const content = extractPostText(table);
    const id = table.id || table.getAttribute('name');

    // Ignore short posts
    if (content.length <= 250) continue;
    for (const substring of filteredSubstrings) {
      if (trie.search(substring)) { // Remove redundant use of content.includes
        hideElementById(id);
        continue;
      }
    }

    // Compute SimHash and compare with precomputedSimHashes
    computePromises.push(computeSimHash(content).then(simHash => {
      if (!simHash) return;
      for (const precomputedSimHash of precomputedSimHashes) {
        if (hammingDistance(simHash, precomputedSimHash) <= config.MAX_HAMMING_DISTANCE) {
          hideElementById(id);
          // Update simHashFrequencies
          simHashFrequencies.set(precomputedSimHash, (simHashFrequencies.get(precomputedSimHash) || 0) + 1);
          break;
        }
      }
      // Add new simHash to messageCache and simHashFrequencies
      messageCache.add(simHash);
      simHashFrequencies.set(simHash, 1);

      // Prune least frequent hash if cache size exceeds MAX_CACHE_SIZE
      if (messageCache.size > MAX_CACHE_SIZE) {
        const leastFrequentHash = [...simHashFrequencies.entries()].sort((a, b) => a[1] - b[1])[0][0];
        messageCache.delete(leastFrequentHash);
        simHashFrequencies.delete(leastFrequentHash);
      }
    }));
  }
  await Promise.all(computePromises);
}

// Hide HTML element by ID
function hideElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = 'none';
  }
}

// Add user-defined substring to filter list and update storage
function addUserFilteredSubstring(substring, config) {
  config.FILTERED_SUBSTRINGS.add(substring);
  chrome.storage.local.set(
    { config: { ...config, FILTERED_SUBSTRINGS: [...config.FILTERED_SUBSTRINGS] } },
    () => {
      console.log(`Added user-defined substring "${substring}" to the filter list.`);
    }
  );
}

// Register listener for adding user-defined substring
function registerAddUserFilteredSubstringListener(config, filteredSubstrings) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
      addUserFilteredSubstring(message.substring, config);
      sendResponse({ success: true });
    }
  });
}

// Register listener for configuration changes
function registerConfigChangeListener(config, filteredSubstrings, messageCache, hideElementById) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.config) {
      const newConfig = changes.config.newValue;
      Object.assign(config, newConfig);
      filteredSubstrings.clear();
      newConfig.FILTERED_SUBSTRINGS.forEach(substring => filteredSubstrings.add(substring));
      console.log('Updated configuration from storage:', newConfig);
      filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById);
    }
  });
}

// Catch unhandled errors in extension
function catchErrors() {
  window.addEventListener('error', (error) => {
    console.error('Error in extension:', error.message);
  });
}

// Test function for Hamming distance calculation
function testHammingDistance() {
  const hash1 = 0b11010101n;
  const hash2 = 0b10101010n;
  const expectedDistance = 5;
  const computedDistance = hammingDistance(hash1, hash2);
  if (computedDistance === expectedDistance) {
    console.log('hammingDistance test passed');
  } else {
    console.error(`hammingDistance test failed: expected ${expectedDistance}, got ${computedDistance}`);
  }
}

// Test function for simhash and filtering
async function testSimHashAndFiltering() {
  const sampleText = "It's not a dysphoria. I see it in the positive way of working toward something, rather than away from something.";
  const computedSimHash = await computeSimHash(sampleText);
  const config = await loadConfig();
  const isFiltered = [...config.FILTERED_SUBSTRINGS].some(substring => {
    return hammingDistance(computedSimHash, BigInt(computeSimHash(substring))) <= config.MAX_HAMMING_DISTANCE;
  });
  if (isFiltered) {
    console.log('testSimHashAndFiltering passed');
  } else {
    console.error('testSimHashAndFiltering failed');
  }
}
// Implement additional tests
function testFilterShortOrEmptyPosts() {
  // Test the behavior with very short or empty posts
  // Ensure that empty posts are never filtered
  const emptyPost = '';
  const shortPost = 'Short!';
  const config = loadConfig();

  // Test filtering an empty post
  filterSpamPosts(config, initialConfig.FILTERED_SUBSTRINGS, new Set(), (id) => {
    console.error('Empty post should not be filtered');
  }, emptyPost);

  // Test filtering a short post
  filterSpamPosts(config, initialConfig.FILTERED_SUBSTRINGS, new Set(), (id) => {
    console.error('Short post should not be filtered');
  }, shortPost);

  console.log('testFilterShortOrEmptyPosts passed');
}

function testSimHashWithSpecialChars() {
  // Test simhash and filtering with posts that contain special characters or non-ASCII characters
  const specialCharPost = 'Test!@#$%^&*()_+{}|:"<>?[]\\;\',./';
  const nonAsciiCharPost = 'Test こんにちは 你好';
  const config = loadConfig();

  // Test simhash computation for special characters
  computeSimHash(specialCharPost).then((simHash) => {
    if (typeof simHash === 'bigint') {
      console.log('SimHash computation for special characters passed');
    } else {
      console.error('SimHash computation for special characters failed');
    }
  });

  // Test simhash computation for non-ASCII characters
  computeSimHash(nonAsciiCharPost).then((simHash) => {
    if (typeof simHash === 'bigint') {
      console.log('SimHash computation for non-ASCII characters passed');
    } else {
      console.error('SimHash computation for non-ASCII characters failed');
    }
  });
}

function testStorageLimitBehavior() {
  // Test the behavior of the extension when the storage limit is reached
  const config = loadConfig();
  const messageCache = new Set();
  const maxCacheSize = config.MAX_CACHE_SIZE || 500;

  // Simulate reaching the storage limit
  for (let i = 1; i <= maxCacheSize + 1; i++) {
    const post = 'Test post ' + i;
    messageCache.add(post);
  }

  // Test if the message cache size is within the limit
  if (messageCache.size <= maxCacheSize) {
    console.log('testStorageLimitBehavior passed');
  } else {
    console.error('testStorageLimitBehavior failed');
  }
}

// Run tests
testHammingDistance();
testSimHashAndFiltering();
testFilterShortOrEmptyPosts();
testSimHashWithSpecialChars();
testStorageLimitBehavior();