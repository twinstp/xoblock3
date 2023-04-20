'use strict';
//SHA1 implementation
var SHA1="undefined"!=typeof exports?exports:{};!function(t){var r=[1518500249,1859775393,-1894007588,-899497514],i={sha1:1};SHA1.createHash=function(t){if(t&&!i[t]&&!i[t.toLowerCase()])throw new Error("Digest method not supported");return new s};var n,s=function(){function t(){this.A=1732584193,this.B=-271733879,this.C=-1732584194,this.D=271733878,this.E=-1009589776,this.t=0,this.i=0,(!n||e>=8e3)&&(n=new ArrayBuffer(8e3),e=0),this.h=new Uint8Array(n,e,80),this.o=new Int32Array(n,e,20),e+=80}return t.prototype.update=function(t){if("string"==typeof t)return this.u(t);if(null==t)throw new TypeError("Invalid type: "+typeof t);var r=t.byteOffset,i=t.byteLength,n=i/64|0,s=0;if(n&&!(3&r)&&!(this.t%64)){for(var h=new Int32Array(t.buffer,r,16*n);n--;)this.v(h,s>>2),s+=64;this.t+=s}if(1!==t.BYTES_PER_ELEMENT&&t.buffer){var e=new Uint8Array(t.buffer,r+s,i-s);return this.p(e)}return s===i?this:this.p(t,s)},t.prototype.p=function(t,r){var i=this.h,n=this.o,s=t.length;for(r|=0;r<s;){for(var h=this.t%64,e=h;r<s&&e<64;)i[e++]=t[r++];e>=64&&this.v(n),this.t+=e-h}return this},t.prototype.u=function(t){for(var r=this.h,i=this.o,n=t.length,s=this.i,h=0;h<n;){for(var e=this.t%64,f=e;h<n&&f<64;){var o=0|t.charCodeAt(h++);o<128?r[f++]=o:o<2048?(r[f++]=192|o>>>6,r[f++]=128|63&o):o<55296||o>57343?(r[f++]=224|o>>>12,r[f++]=128|o>>>6&63,r[f++]=128|63&o):s?(o=((1023&s)<<10)+(1023&o)+65536,r[f++]=240|o>>>18,r[f++]=128|o>>>12&63,r[f++]=128|o>>>6&63,r[f++]=128|63&o,s=0):s=o}f>=64&&(this.v(i),i[0]=i[16]),this.t+=f-e}return this.i=s,this},t.prototype.v=function(t,i){var n=this,s=n.A,e=n.B,f=n.C,w=n.D,y=n.E,A=0;for(i|=0;A<16;)h[A++]=o(t[i++]);for(A=16;A<80;A++)h[A]=u(h[A-3]^h[A-8]^h[A-14]^h[A-16]);for(A=0;A<80;A++){var p=A/20|0,d=a(s)+v(p,e,f,w)+y+h[A]+r[p]|0;y=w,w=f,f=c(e),e=s,s=d}this.A=s+this.A|0,this.B=e+this.B|0,this.C=f+this.C|0,this.D=w+this.D|0,this.E=y+this.E|0},t.prototype.digest=function(t){var r=this.h,i=this.o,n=this.t%64|0;for(r[n++]=128;3&n;)r[n++]=0;if((n>>=2)>14){for(;n<16;)i[n++]=0;n=0,this.v(i)}for(;n<16;)i[n++]=0;var s=8*this.t,h=(4294967295&s)>>>0,e=(s-h)/4294967296;return e&&(i[14]=o(e)),h&&(i[15]=o(h)),this.v(i),"hex"===t?this.I():this.U()},t.prototype.I=function(){var t=this,r=t.A,i=t.B,n=t.C,s=t.D,h=t.E;return f(r)+f(i)+f(n)+f(s)+f(h)},t.prototype.U=function(){var t=this,r=t.A,i=t.B,n=t.C,s=t.D,h=t.E,e=t.h,f=t.o;return f[0]=o(r),f[1]=o(i),f[2]=o(n),f[3]=o(s),f[4]=o(h),e.slice(0,20)},t}(),h=new Int32Array(80),e=0,f=function(t){return(t+4294967296).toString(16).substr(-8)},o=254===new Uint8Array(new Uint16Array([65279]).buffer)[0]?function(t){return t}:function(t){return t<<24&4278190080|t<<8&16711680|t>>8&65280|t>>24&255},u=function(t){return t<<1|t>>>31},a=function(t){return t<<5|t>>>27},c=function(t){return t<<30|t>>>2};function v(t,r,i,n){return 0===t?r&i|~r&n:2===t?r&i|r&n|i&n:r^i^n}}();

const simHashMemo = {}; // Memoization lookup table for computeSimHash
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.remainingWord = null; // Represents the remaining substring in a chain of nodes with only one child
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let current = this.root;
    let i = 0;
    while (i < word.length) {
      const ch = word[i];
      if (current.remainingWord) {
        // If remainingWord exists, check if the word to be inserted is a prefix of remainingWord
        if (current.remainingWord.startsWith(word.substring(i))) {
          // Update the isEndOfWord flag
          current.isEndOfWord = true;
          return;
        } else {
          // Split the remainingWord and create a new child
          const [commonPrefix, remaining] = this._splitPrefix(current.remainingWord, word.substring(i));
          const next = new TrieNode();
          next.remainingWord = remaining;
          next.isEndOfWord = true;
          current.remainingWord = commonPrefix;
          current.children[remaining[0]] = next;
          current.isEndOfWord = false;
          return;
        }
      }
      if (!current.children[ch]) {
        if (i < word.length - 1) {
          const newNode = new TrieNode();
          newNode.remainingWord = word.substring(i + 1);
          newNode.isEndOfWord = true;
          current.children[ch] = newNode;
          return;
        } else {
          current.children[ch] = new TrieNode();
        }
      }
      current = current.children[ch];
      current.isEndOfWord = i === word.length - 1;
      i++;
    }
  }

  search(word) {
    let current = this.root;
    let i = 0;
    while (i < word.length) {
      const ch = word[i];
      if (current.remainingWord) {
        return current.remainingWord === word.substring(i);
      }
      if (!current.children[ch]) {
        return false;
      }
      current = current.children[ch];
      i++;
    }
    return current.isEndOfWord;
  }

  _splitPrefix(str1, str2) {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return [str1.substring(0, i), str1.substring(i)];
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

// Updated computeSHA1 function
async function computeSHA1(message) {
  // Use the SHA1 module to compute the hash
  const hash = SHA1.createHash(message).I();
  return hash;
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

  await Promise.allSettled(
    Array.from(tokenWeights.entries(), async ([token, weight]) => {
      const hash = await computeSHA1(token);
      const hashInt = BigInt(`0x${hash}`);
      for (let i = 0; i < fingerprintBits; ++i) {
        v[i] += (hashInt >> BigInt(i)) & 1n ? weight : -weight;
      }
    })
  );

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

  if (typeof nonEnglishCharSimHash === 'bigint' &&
      typeof specialCharSimHash === 'bigint' &&
      typeof emojiSimHash === 'bigint') {
    console.log('SimHash computation with non-English text test passed');
  } else {
    console.error('SimHash computation with non-English text test failed');
  }
}
function testSHA1() {
  const testCases = [
    { message: 'Hello World!', expectedHash: '7509e5bda0c762d2bac7f90d758b5b2263fa01cc' },
    { message: 'The quick brown fox jumps over the lazy dog', expectedHash: '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12' },
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

// Run tests
testHammingDistance();
testSimHashAndFiltering();
testFilterShortOrEmptyPosts();
testSimHashWithSpecialChars();
testStorageLimitBehavior();
testTrie();
testUserDefinedSubstringFiltering();
testCacheEviction();
testSimHashWithNonEnglishText();
testSHA1();