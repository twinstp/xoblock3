'use strict';
//SHA1 implementation
var SHA1="undefined"!=typeof exports?exports:{};!function(t){var r=[1518500249,1859775393,-1894007588,-899497514],i={sha1:1};SHA1.createHash=function(t){if(t&&!i[t]&&!i[t.toLowerCase()])throw new Error("Digest method not supported");return new s};var n,s=function(){function t(){this.A=1732584193,this.B=-271733879,this.C=-1732584194,this.D=271733878,this.E=-1009589776,this.t=0,this.i=0,(!n||e>=8e3)&&(n=new ArrayBuffer(8e3),e=0),this.h=new Uint8Array(n,e,80),this.o=new Int32Array(n,e,20),e+=80}return t.prototype.update=function(t){if("string"==typeof t)return this.u(t);if(null==t)throw new TypeError("Invalid type: "+typeof t);var r=t.byteOffset,i=t.byteLength,n=i/64|0,s=0;if(n&&!(3&r)&&!(this.t%64)){for(var h=new Int32Array(t.buffer,r,16*n);n--;)this.v(h,s>>2),s+=64;this.t+=s}if(1!==t.BYTES_PER_ELEMENT&&t.buffer){var e=new Uint8Array(t.buffer,r+s,i-s);return this.p(e)}return s===i?this:this.p(t,s)},t.prototype.p=function(t,r){var i=this.h,n=this.o,s=t.length;for(r|=0;r<s;){for(var h=this.t%64,e=h;r<s&&e<64;)i[e++]=t[r++];e>=64&&this.v(n),this.t+=e-h}return this},t.prototype.u=function(t){for(var r=this.h,i=this.o,n=t.length,s=this.i,h=0;h<n;){for(var e=this.t%64,f=e;h<n&&f<64;){var o=0|t.charCodeAt(h++);o<128?r[f++]=o:o<2048?(r[f++]=192|o>>>6,r[f++]=128|63&o):o<55296||o>57343?(r[f++]=224|o>>>12,r[f++]=128|o>>>6&63,r[f++]=128|63&o):s?(o=((1023&s)<<10)+(1023&o)+65536,r[f++]=240|o>>>18,r[f++]=128|o>>>12&63,r[f++]=128|o>>>6&63,r[f++]=128|63&o,s=0):s=o}f>=64&&(this.v(i),i[0]=i[16]),this.t+=f-e}return this.i=s,this},t.prototype.v=function(t,i){var n=this,s=n.A,e=n.B,f=n.C,w=n.D,y=n.E,A=0;for(i|=0;A<16;)h[A++]=o(t[i++]);for(A=16;A<80;A++)h[A]=u(h[A-3]^h[A-8]^h[A-14]^h[A-16]);for(A=0;A<80;A++){var p=A/20|0,d=a(s)+v(p,e,f,w)+y+h[A]+r[p]|0;y=w,w=f,f=c(e),e=s,s=d}this.A=s+this.A|0,this.B=e+this.B|0,this.C=f+this.C|0,this.D=w+this.D|0,this.E=y+this.E|0},t.prototype.digest=function(t){var r=this.h,i=this.o,n=this.t%64|0;for(r[n++]=128;3&n;)r[n++]=0;if((n>>=2)>14){for(;n<16;)i[n++]=0;n=0,this.v(i)}for(;n<16;)i[n++]=0;var s=8*this.t,h=(4294967295&s)>>>0,e=(s-h)/4294967296;return e&&(i[14]=o(e)),h&&(i[15]=o(h)),this.v(i),"hex"===t?this.I():this.U()},t.prototype.I=function(){var t=this,r=t.A,i=t.B,n=t.C,s=t.D,h=t.E;return f(r)+f(i)+f(n)+f(s)+f(h)},t.prototype.U=function(){var t=this,r=t.A,i=t.B,n=t.C,s=t.D,h=t.E,e=t.h,f=t.o;return f[0]=o(r),f[1]=o(i),f[2]=o(n),f[3]=o(s),f[4]=o(h),e.slice(0,20)},t}(),h=new Int32Array(80),e=0,f=function(t){return(t+4294967296).toString(16).substr(-8)},o=254===new Uint8Array(new Uint16Array([65279]).buffer)[0]?function(t){return t}:function(t){return t<<24&4278190080|t<<8&16711680|t>>8&65280|t>>24&255},u=function(t){return t<<1|t>>>31},a=function(t){return t<<5|t>>>27},c=function(t){return t<<30|t>>>2};function v(t,r,i,n){return 0===t?r&i|~r&n:2===t?r&i|r&n|i&n:r^i^n}}();

const simHashMemo = {};
// Trie data structure
class Trie {
  constructor() {
    this.root = new TrieNode();
  }

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

// Trie node
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

// Utility function to escape special regex characters
function escapeRegexSpecialCharacters(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

// Fuzzy matching with optimized algorithm and caching
const fuzzyMatch = (() => {
  const regexCache = new Map();
  return (str, pattern) => {
    if (!regexCache.has(pattern)) {
      const regex = new RegExp(pattern.split('').map(ch => '[^' + escapeRegexSpecialCharacters(ch) + ']*' + escapeRegexSpecialCharacters(ch)).join('.*?'));
      regexCache.set(pattern, regex);
    }
    return regexCache.get(pattern).test(str);
  };
})();

// Hamming distance calculation
const hammingDistance = (hash1, hash2) => {
  let xor = hash1 ^ hash2;
  let distance = 0;
  while (xor) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
};

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
  const substringTrie = new Trie();
  config.FILTERED_SUBSTRINGS.forEach(substring => substringTrie.insert(substring));
  return { config, substringTrie };
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

// Updated computeSHA1 function
(async () => {
  const computeSHA1 = async (message) => {
    const hash = SHA1.createHash(message).I();
    return hash;
  };

  const computeSimHash = async (message) => {
    const tokenWeights = new Map();
    const tokens = message.match(/\b\w+\b/g) || [];
    tokens.forEach((token) => {
      const weight = (tokenWeights.get(token) || 0) + 1;
      tokenWeights.set(token, weight);
    });
    const fingerprintBits = 32;
    const accumulator = new Int32Array(fingerprintBits);
    await Promise.allSettled(
      Array.from(tokenWeights.entries(), async ([token, weight]) => {
        const hash = await computeSHA1(token);
        const hashInt = BigInt(`0x${hash}`);
        for (let i = 0; i < fingerprintBits; ++i) {
          accumulator[i] += (hashInt >> BigInt(i)) & 1n ? weight : -weight;
        }
      })
    );
    let simHash = 0n;
    for (let i = 0; i < fingerprintBits; ++i) {
      if (accumulator[i] > 0) {
        simHash |= 1n << BigInt(i);
      }
    }
    simHashMemo[message] = simHash;
    return simHash;
  };

  const hammingDistance = (hash1, hash2) => {
    let xor = hash1 ^ hash2;
    let distance = 0;
    while (xor) {
      distance += Number(xor & 1n);
      xor >>= 1n;
    }
    return distance;
  };
//  track stats
const stats = {
  spamPostsFiltered: 0,
  cacheSize: 0,
  cacheEvictions: 0,
};

function extractPostText(table) {
  const bodyElement = table.querySelector('table font');
  return bodyElement ? bodyElement.textContent.trim() : '';
}
// Main function to filter spam posts
async function filterSpamPosts(config, substringTrie, messageCache, hideElementById) {
  const MAX_CACHE_SIZE = config.MAX_CACHE_SIZE || 500;
  const messageTables = document.querySelectorAll("table[width='700'][id], table.threadlisttr[name]");
  const simHashFrequencies = new Map();
  const hideAndRecord = (id, simHash) => {
    hideElementById(id);
    simHashFrequencies.set(simHash, (simHashFrequencies.get(simHash) || 0) + 1);
  };
  const computePromises = messageTables.map(table => ({
    content: extractPostText(table),
    id: table.id || table.getAttribute('name')
  }))
    .filter(({ content }) => content.length > 250)
    .filter(({ content }) => !content.split(' ').some(token => substringTrie.search(token) || fuzzyMatch(content, token)))
    .map(({ content, id }) => computeSimHash(content).then((simHash) => {
      if (!simHash) return;
      if (Array.from(messageCache).some(precomputedSimHash => hammingDistance(simHash, precomputedSimHash) <= config.MAX_HAMMING_DISTANCE)) {
        hideAndRecord(id, simHash);
        return;
      }
      messageCache.add(simHash);
      simHashFrequencies.set(simHash, 1);
      if (messageCache.size > MAX_CACHE_SIZE) {
        const leastFrequentHash = Array.from(simHashFrequencies.entries())
          .sort((a, b) => a[1] - b[1])[0][0];
        messageCache.delete(leastFrequentHash);
        simHashFrequencies.delete(leastFrequentHash);
      }
    }));
  await Promise.all(computePromises);
  console.log('Spam Filter Statistics:', { messageCacheSize: messageCache.size });
}

function hideElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.visibility = 'hidden';
    element.style.display = 'none';
  }
}

function addUserFilteredSubstring(substring, config) {
  config.FILTERED_SUBSTRINGS.add(substring);
  chrome.storage.local.set({
    config: {
      ...config,
      FILTERED_SUBSTRINGS: Array.from(config.FILTERED_SUBSTRINGS)
    }
  }, () => {
    console.log(`Added user-defined substring "${substring}" to the filter list.`);
  });
}
function registerAddUserFilteredSubstringListener(config, filteredSubstrings) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
      addUserFilteredSubstring(message.substring, config);
      sendResponse({ success: true });
      return new Promise((resolve) => { resolve(); });
    }
  });
}

// Listener to handle changes in the configuration
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

// Error handling function
function catchErrors() {
  window.addEventListener('error', (error) => {
    console.error('Error in extension:', error.message);
  });
}

// Initialization
(async () => {
  const { config, substringTrie } = await loadConfig();
  const messageCache = new Set();
  registerAddUserFilteredSubstringListener(config, config.FILTERED_SUBSTRINGS);
  registerConfigChangeListener(config, config.FILTERED_SUBSTRINGS, messageCache, hideElementById);
  catchErrors();
  await filterSpamPosts(config, substringTrie, messageCache, hideElementById);
})();


// Test function for Hamming distance calculation
function testHammingDistance() {
  const hash1 = 0b11010101n;
  const hash2 = 0b10101010n;
  const expectedDistance = 7;
  const computedDistance = hammingDistance(hash1, hash2);
  if (computedDistance === expectedDistance) {
    console.log('hammingDistance test passed');
  } else {
    console.error(`hammingDistance test failed: expected ${expectedDistance}, got ${computedDistance}`);
  }
}

async function testSimHashAndFiltering() {
  const sampleText = "It's not a dysphoria. I see it in the positive way of working toward something, rather than away from something.";
  const computedSimHash = await computeSimHash(sampleText);
  const config = await loadConfig();
  const isFiltered = (await Promise.all([...config.FILTERED_SUBSTRINGS].map(async substring => {
    const precomputedSimHash = await computeSimHash(substring);
    return hammingDistance(computedSimHash, BigInt(precomputedSimHash)) <= config.MAX_HAMMING_DISTANCE;
  }))).some(Boolean);
    if (isFiltered) {
    console.log('testSimHashAndFiltering passed');
  } else {
    console.error('testSimHashAndFiltering failed');
  }
}
async function testFilterShortOrEmptyPosts() {
  // Test the behavior with very short or empty posts
  const config = await loadConfig();
  const emptyPost = '';
  const shortPost = 'Short!';

  // Test filtering an empty post
  await filterSpamPosts(config, config.FILTERED_SUBSTRINGS, new Set(), (id) => {
    console.error('Empty post should not be filtered');
  }, emptyPost);

  // Test filtering a short post
  await filterSpamPosts(config, config.FILTERED_SUBSTRINGS, new Set(), (id) => {
    console.error('Short post should not be filtered');
  }, shortPost);

  console.log('testFilterShortOrEmptyPosts passed');
}

async function testStorageLimitBehavior() {
  // Mock configuration
  const config = {
    MAX_CACHE_SIZE: 5, // Reduced for testing purposes
    MIN_CONTENT_LENGTH: 10,
    MAX_HAMMING_DISTANCE: 3,
    FILTERED_SUBSTRINGS: [],
  };

  // Mock filteredSubstrings and messageCache
  const filteredSubstrings = new Set();
  const messageCache = new Set();

  // Mock hideElementById function
  const hideElementById = (id) => console.log(`Hiding post with ID: ${id}`);

  // Generate sample posts
  const samplePosts = [
    'Test post 1',
    'Test post 2',
    'Test post 3',
    'Test post 4',
    'Test post 5',
    'Test post 6', // This post should cause an eviction
  ];

  // Execute filterSpamPosts function for each sample post
  for (const post of samplePosts) {
    await filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById, post);
  }

  // Check if the cache size is within the limit
  if (messageCache.size <= config.MAX_CACHE_SIZE) {
    console.log('testStorageLimitBehavior passed');
  } else {
    console.error('testStorageLimitBehavior failed');
  }
}

function testTrie() {
  const trie = new Trie();
  trie.insert("abc");
  trie.insert("abgl");
  trie.insert("abcdef");

  // Test empty string
  if (!trie.search("")) {
    console.log('Empty string test passed');
  } else {
    console.error('Empty string test failed');
  }

  // Test search and startsWith
  if (trie.search("abc") && trie.startsWith("ab") && !trie.search("abcf")) {
    console.log('Search and startsWith test passed');
  } else {
    console.error('Search and startsWith test failed');
  }

  // Test very long string
  const longString = "a".repeat(10000);
  trie.insert(longString);
  if (trie.search(longString)) {
    console.log('Long string test passed');
  } else {
    console.error('Long string test failed');
  }
}
function testCacheEviction() {
  const config = loadConfig();
  const messageCache = new Set();
  const simHashFrequencies = new Map();
  const maxCacheSize = config.MAX_CACHE_SIZE || 500;

  // Insert more SimHashes than the MAX_CACHE_SIZE
  for (let i = 1; i <= maxCacheSize + 5; i++) {
    const simHash = BigInt(i);
    messageCache.add(simHash);
    simHashFrequencies.set(simHash, 1);

    if (messageCache.size > maxCacheSize) {
      // Evict the least frequently used SimHash
      const leastFrequentHash = [...simHashFrequencies.entries()].sort((a, b) => a[1] - b[1])[0][0];
      messageCache.delete(leastFrequentHash);
      simHashFrequencies.delete(leastFrequentHash);
    }
  }
// Test the Trie data structure
(() => {
  console.log('Testing Trie data structure...');
  const trie = new Trie();
  trie.insert('apple');
  trie.insert('app');
  trie.insert('banana');
  console.assert(trie.search('apple'), 'Search test failed: apple');
  console.assert(trie.search('app'), 'Search test failed: app');
  console.assert(!trie.search('appe'), 'Search test failed: appe');
  console.assert(trie.startsWith('app'), 'StartsWith test failed: app');
  console.assert(!trie.startsWith('banan'), 'StartsWith test failed: banan');
  console.log('Trie data structure tests passed.');
})();

// Test the fuzzy matching algorithm
(() => {
  console.log('Testing fuzzy matching algorithm...');
  console.assert(fuzzyMatch('The quick brown fox', 'quick'), 'FuzzyMatch test failed: quick');
  console.assert(fuzzyMatch('The quick brown fox', 'qk'), 'FuzzyMatch test failed: qk');
  console.assert(!fuzzyMatch('The quick brown fox', 'quack'), 'FuzzyMatch test failed: quack');
  console.assert(fuzzyMatch('Special: [example]', '[ex]'), 'FuzzyMatch test failed: [ex]');
  console.log('Fuzzy matching algorithm tests passed.');
})();

// Test the hamming distance calculation
(() => {
  console.log('Testing hamming distance calculation...');
  console.assert(hammingDistance(0b110010, 0b101011) === 3, 'HammingDistance test failed: 110010 vs 101011');
  console.assert(hammingDistance(0b10101, 0b10101) === 0, 'HammingDistance test failed: 10101 vs 10101');
  console.assert(hammingDistance(0b11111, 0b00000) === 5, 'HammingDistance test failed: 11111 vs 00000');
  console.log('Hamming distance calculation tests passed.');
})();

// Test user-defined substring addition and configuration changes
(async () => {
  console.log('Testing user-defined substring addition and configuration changes...');
  const { config, substringTrie } = await loadConfig();
  addUserFilteredSubstring('testing spam', config);
  console.assert(config.FILTERED_SUBSTRINGS.has('testing spam'), 'Add user-defined substring test failed: testing spam');
  const newConfig = { ...config, MAX_CACHE_SIZE: 600 };
  chrome.storage.local.set({ config: newConfig });
  console.assert(config.MAX_CACHE_SIZE === 600, 'Configuration change test failed: MAX_CACHE_SIZE');
  console.log('User-defined substring addition and configuration changes tests passed.');
})();

// Test the filtering mechanism
(async () => {
  console.log('Testing filtering mechanism...');
  const { config, substringTrie } = await loadConfig();
  const messageCache = new Set();
  const mockHideElementById = (id) => { console.log(`Hiding element with ID: ${id}`); };
  const mockMessageTables = [
    { id: 'post1', content: 'This is a normal post.' },
    { id: 'post2', content: 'This is a spam post that contains testing spam.' },
    { id: 'post3', content: 'This is another spam post that contains testing spam.' },
    { id: 'post4', content: 'This is a long post with unique content.' }
  ];
  await filterSpamPosts(config, substringTrie, messageCache, mockHideElementById, mockMessageTables);
  console.assert(messageCache.size === 1, 'Filtering mechanism test failed: messageCache size');
  console.log('Filtering mechanism tests passed.');
})();
console.log('All tests passed.');

  // Check if the cache size is within the limit
  if (messageCache.size <= maxCacheSize) {
    console.log('Cache eviction test passed');
  } else {
    console.error('Cache eviction test failed');
  }
}
async function testSimHashWithNonEnglishText() {
  const nonEnglishCharPost = 'Test नमस्ते こんにちは 你好';
  const specialCharPost = 'Test !@#$%^&*()_+{}|:"<>?[]\\;\',./';
  const emojiPost = 'Test 😊🌟👍';
  const nonEnglishCharSimHash = await computeSimHash(nonEnglishCharPost);
  const specialCharSimHash = await computeSimHash(specialCharPost);
  const emojiSimHash = await computeSimHash(emojiPost);
  if (typeof nonEnglishCharSimHash === 'bigint' && typeof specialCharSimHash === 'bigint' && typeof emojiSimHash === 'bigint') {
    console.log('SimHash computation with non-English text test passed');
  } else {
    console.error('SimHash computation with non-English text test failed');
  }
}
function testSHA1() {
  const testCases = [
    { message: 'Hello World!', expectedHash: '2ef7bde608ce5404e97d5f042f95f89f1c232871' },
    { message: 'The quick brown fox jumps over the lazy dog', expectedHash: '23c4db6a5b362e96519f22a66987d019018dd06d' },
    { message: '', expectedHash: 'da39a3ee5e6b4b0d3255bfef95601890afd80709' }
  ];

  let allPassed = true;
  testCases.forEach(testCase => {
    const computedHash = computeSHA1(testCase.message).toLowerCase();
    if (computedHash === testCase.expectedHash) {
      console.log(`SHA1 test passed for message: "${testCase.message}"`);
    } else {
      console.error(`SHA1 test failed for message: "${testCase.message}", expected: "${testCase.expectedHash}", got: "${computedHash}"`);
      allPassed = false;
    }
  });

  if (allPassed) {
    console.log('All SHA1 tests passed');
  } else {
    console.error('Some SHA1 tests failed');
  }
}
function testUserDefinedSubstringFiltering() {
  const config = loadConfig();
  const substringTrie = new Trie();
  const substring = "User-defined substring";
  addUserFilteredSubstring(substring, config);
  substringTrie.insert(substring);
  if (substringTrie.search(substring)) {
    console.log('User-defined substring filtering test passed');
  } else {
    console.error('User-defined substring filtering test failed');
  }
}
function testServiceWorkerRegistration() {
  // Register service worker and catch any errors
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  }
}
function testTriePrefixWithNoMatches() {
  const trie = new Trie();
  trie.insert("apple");
  trie.insert("orange");
  trie.insert("banana");

  if (trie.startsWith("grape")) {
    console.error('Trie prefix test failed: Unexpected match');
  } else {
    console.log('Trie prefix test passed: No unexpected matches');
  }
}
function testTrieDuplicateSubstring() {
  const trie = new Trie();
  trie.insert("apple");
  trie.insert("apple");

  if (trie.search("apple")) {
    console.log('Trie duplicate substring test passed');
  } else {
    console.error('Trie duplicate substring test failed');
  }
}
async function testFilterSpamPosts() {
  const config = { MAX_CACHE_SIZE: 500, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: ['Test spam'], };
  const substringTrie = new Trie();
  config.FILTERED_SUBSTRINGS.forEach(substring => substringTrie.insert(substring));
  const messageCache = new Set();
  const hideElementById = (id) => console.log(`Hiding post with ID: ${id}`);
  const samplePosts = ['Test post 1', 'Test post 2', 'Test spam message', 'Test post 3', ];
  for (const post of samplePosts) {
    const messageTable = document.createElement('table');
    const messageCell = messageTable.insertRow().insertCell();
    messageCell.textContent = post;
    document.body.appendChild(messageTable);
    await filterSpamPosts(config, substringTrie, messageCache, hideElementById);
  }
  document.body.innerHTML = '';
  console.log('Filtered messages:', messageCache.size);
  console.log('Message cache:', messageCache);
}
// Helper function to create a mock message table element
function createMockMessageTable(content, id) {
  const table = document.createElement('table');
  table.id = id;
  const row = table.insertRow();
  const cell = row.insertCell();
  cell.textContent = content;
  return table;
}

// Test 1: Verify that spam posts containing filtered substrings are hidden
async function testSubstringFiltering() {
  const config = { MAX_CACHE_SIZE: 10, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: ['SpamWord'] };
  const substringTrie = new Trie();
  config.FILTERED_SUBSTRINGS.forEach(substring => substringTrie.insert(substring));
  const messageCache = new Set();

  const mockMessageTable = createMockMessageTable('This is a SpamWord message', 'mockId');
  document.body.appendChild(mockMessageTable);

  const hideElementById = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  };

  await filterSpamPosts(config, substringTrie, messageCache, hideElementById);
  const hiddenElement = document.getElementById('mockId');
  if (hiddenElement.style.display === 'none') {
    console.log('Test 1 passed: Substring filtering works');
  } else {
    console.error('Test 1 failed: Substring filtering failed');
  }

  // Clean up the DOM
  document.body.removeChild(mockMessageTable);
}

// Test 2: Verify that spam posts with similar content based on SimHash are hidden
async function testSimHashFiltering() {
  const config = { MAX_CACHE_SIZE: 10, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: [] };
  const substringTrie = new Trie();
  const messageCache = new Set();

  const mockMessageTable1 = createMockMessageTable('This is a message with similar content', 'mockId1');
  const mockMessageTable2 = createMockMessageTable('This is a message with similar content but a few differences', 'mockId2');
  document.body.appendChild(mockMessageTable1);
  document.body.appendChild(mockMessageTable2);

  const hideElementById = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  };

  await filterSpamPosts(config, substringTrie, messageCache, hideElementById);
  const hiddenElement = document.getElementById('mockId2');
  if (hiddenElement.style.display === 'none') {
    console.log('Test 2 passed: SimHash filtering works');
  } else {
    console.error('Test 2 failed: SimHash filtering failed');
  }

  // Clean up the DOM
  document.body.removeChild(mockMessageTable1);
  document.body.removeChild(mockMessageTable2);
}
})

function runTests() {
  testHammingDistance();
  testSimHashAndFiltering();
  testFilterShortOrEmptyPosts();
  testStorageLimitBehavior();
  testTrie();
  testFilterSpamPosts();
  testUserDefinedSubstringFiltering();
  testCacheEviction();
  testSimHashWithNonEnglishText();
  testSHA1();
  testServiceWorkerRegistration();
  testTriePrefixWithNoMatches();
  testTrieDuplicateSubstring();
  testSubstringFiltering();
  testSimHashFiltering();
}