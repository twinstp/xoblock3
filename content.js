'use strict';
// ## SHA1 implementation (minified) - NEED TO ADD HERE NOT CALL CRYPTO OR SUBTLE JS B/C OF CPS AND MANIFEST V3
var SHA1=
"undefined"!=typeof exports?exports:{};!function(t){var r=[1518500249,1859775393,-1894007588,-899497514],i={sha1:1};SHA1.createHash=function(t){if(t&&!i[t]&&!i[t.toLowerCase()])throw new Error("Digest method not supported");return new s};var n,s=function(){function t(){this.A=1732584193,this.B=-271733879,this.C=-1732584194,this.D=271733878,this.E=-1009589776,this.t=0,this.i=0,(!n||e>=8e3)&&(n=new ArrayBuffer(8e3),e=0),this.h=new Uint8Array(n,e,80),this.o=new Int32Array(n,e,20),e+=80}return t.prototype.update=function(t){if("string"==typeof t)return this.u(t);if(null==t)throw new TypeError("Invalid type: "+typeof t);var r=t.byteOffset,i=t.byteLength,n=i/64|0,s=0;if(n&&!(3&r)&&!(this.t%64)){for(var h=new Int32Array(t.buffer,r,16*n);n--;)this.v(h,s>>2),s+=64;this.t+=s}if(1!==t.BYTES_PER_ELEMENT&&t.buffer){var e=new Uint8Array(t.buffer,r+s,i-s);return this.p(e)}return s===i?this:this.p(t,s)},t.prototype.p=function(t,r){var i=this.h,n=this.o,s=t.length;for(r|=0;r<s;){for(var h=this.t%64,e=h;r<s&&e<64;)i[e++]=t[r++];e>=64&&this.v(n),this.t+=e-h}return this},t.prototype.u=function(t){for(var r=this.h,i=this.o,n=t.length,s=this.i,h=0;h<n;){for(var e=this.t%64,f=e;h<n&&f<64;){var o=0|t.charCodeAt(h++);o<128?r[f++]=o:o<2048?(r[f++]=192|o>>>6,r[f++]=128|63&o):o<55296||o>57343?(r[f++]=224|o>>>12,r[f++]=128|o>>>6&63,r[f++]=128|63&o):s?(o=((1023&s)<<10)+(1023&o)+65536,r[f++]=240|o>>>18,r[f++]=128|o>>>12&63,r[f++]=128|o>>>6&63,r[f++]=128|63&o,s=0):s=o}f>=64&&(this.v(i),i[0]=i[16]),this.t+=f-e}return this.i=s,this},t.prototype.v=function(t,i){var n=this,s=n.A,e=n.B,f=n.C,w=n.D,y=n.E,A=0;for(i|=0;A<16;)h[A++]=o(t[i++]);for(A=16;A<80;A++)h[A]=u(h[A-3]^h[A-8]^h[A-14]^h[A-16]);for(A=0;A<80;A++){var p=A/20|0,d=a(s)+v(p,e,f,w)+y+h[A]+r[p]|0;y=w,w=f,f=c(e),e=s,s=d}this.A=s+this.A|0,this.B=e+this.B|0,this.C=f+this.C|0,this.D=w+this.D|0,this.E=y+this.E|0},t.prototype.digest=function(t){var r=this.h,i=this.o,n=this.t%64|0;for(r[n++]=128;3&n;)r[n++]=0;if((n>>=2)>14){for(;n<16;)i[n++]=0;n=0,this.v(i)}for(;n<16;)i[n++]=0;var s=8*this.t,h=(4294967295&s)>>>0,e=(s-h)/4294967296;return e&&(i[14]=o(e)),h&&(i[15]=o(h)),this.v(i),"hex"===t?this.I():this.U()},t.prototype.I=function(){var t=this,r=t.A,i=t.B,n=t.C,s=t.D,h=t.E;return f(r)+f(i)+f(n)+f(s)+f(h)},t.prototype.U=function(){var t=this,r=t.A,i=t.B,n=t.C,s=t.D,h=t.E,e=t.h,f=t.o;return f[0]=o(r),f[1]=o(i),f[2]=o(n),f[3]=o(s),f[4]=o(h),e.slice(0,20)},t}(),h=new Int32Array(80),e=0,f=function(t){return(t+4294967296).toString(16).substr(-8)},o=254===new Uint8Array(new Uint16Array([65279]).buffer)[0]?function(t){return t}:function(t){return t<<24&4278190080|t<<8&16711680|t>>8&65280|t>>24&255},u=function(t){return t<<1|t>>>31},a=function(t){return t<<5|t>>>27},c=function(t){return t<<30|t>>>2};function v(t,r,i,n){return 0===t?r&i|~r&n:2===t?r&i|r&n|i&n:r^i^n}}();
// ## UTILITY FUNCTIONS ##
// Utility function to escape regex special characters
function escapeRegexSpecialCharacters(str) {
  return str.replace(/[-[\]\/{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Define the initial configuration
function getInitialConfig() {
  return {
    MAX_CACHE_SIZE: 1000,
    MAX_HAMMING_DISTANCE: 5,
    LONG_POST_THRESHOLD: 25,
    FILTERED_SUBSTRINGS: [
      'modification, and he recently agreed to answer our questions',
      'legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago',
      'America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling',
      'Go to the link, and look at that woman. Look at that face. She never expressed any remorse over',
      'destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess.'
        ]
  };
}
class SimHashGenerator {
  constructor(fingerprintBits = 32) {
    this.fingerprintBits = fingerprintBits;
    this.tokenWeights = new Map();
    this.accumulator = new Int32Array(this.fingerprintBits);
  }

  compute(message) {
    const tokens = message.match(/\b\w+\b/g) || [];
    const tokenWeights = tokens.reduce((acc, token) => {
      const weight = (acc.get(token) || 0) + 1;
      acc.set(token, weight);
      return acc;
    }, new Map());
    const simHash = new Uint32Array(this.fingerprintBits);
    for (const [token, weight] of tokenWeights) {
      const hash = token.split('').reduce((acc, char) => acc * 31 + char.charCodeAt(0), 0);
      for (let i = 0; i < this.fingerprintBits; ++i) {
        simHash[i] += (hash & (1 << i)) ? weight : -weight;
      }
    }
    return simHash;
  }

  static hammingDistance(hash1, hash2) {
    let distance = 0n;
    let xorResult = hash1 ^ hash2;
    while (xorResult) {
      distance += xorResult & 1n;
      xorResult >>= 1n;
    }
    return distance;
  }
}
class XORFilter {
  constructor(keys, seed = 123456789) {
    this.fingerprintSize = 8; // 8 bits for fingerprints
    this.hashes = 3;
    this.seed = seed; // User-defined seed for hash functions
    this.size = keys.length;
    this.arrayLength = this.getArrayLength(this.size);
    this.blockLength = Math.floor(this.arrayLength / this.hashes);
    this.fingerprints = new Uint8Array(this.arrayLength);
    this.initialize(keys);
  }

  getArrayLength(size) {
    const offset = 32;
    const factorTimes100 = 123;
    return Math.floor(offset + (factorTimes100 * size) / 100);
  }

  hash(key, seed, index) {
    const r = ((key + seed) << (21 * index)) >>> 0;
    return (r % this.blockLength) + index * this.blockLength;
  }

  fingerprint(hash) {
    return hash & ((1 << this.fingerprintSize) - 1);
  }

  initialize(keys) {
    const t2count = new Uint8Array(this.arrayLength);
    const t2 = new Uint32Array(this.arrayLength);
    keys.forEach((key) => {
      for (let hi = 0; hi < this.hashes; hi++) {
        const h = this.hash(key, this.seed, hi);
        t2[h] ^= key;
        t2count[h]++;
      }
    });

    const alone = Array.from({ length: this.hashes }, () => new Set());
    for (let nextAlone = 0; nextAlone < this.hashes; nextAlone++) {
      for (let i = 0; i < this.blockLength; i++) {
        if (t2count[nextAlone * this.blockLength + i] === 1) {
          alone[nextAlone].add(nextAlone * this.blockLength + i);
        }
      }
    }
    const reverseOrder = [];
    const reverseH = [];

    while (true) {
      let found = -1;
      let i = -1;
      for (let hi = 0; hi < this.hashes; hi++) {
        if (alone[hi].size > 0) {
          i = alone[hi].values().next().value;
          alone[hi].delete(i);
          found = hi;
          break;
        }
      }

      if (i === -1) break;
      if (t2count[i] <= 0) continue;
      const k = t2[i];
      t2count[i]--;

      for (let hi = 0; hi < this.hashes; hi++) {
        if (hi !== found) {
          const h = this.hash(k, this.seed, hi);
          t2count[h]--;
          t2[h] ^= k;
          if (t2count[h] === 1) {
            alone[hi].add(h);
          }
        }
      }

      reverseOrder.push(k);
      reverseH.push(found);
    }

    for (let i = reverseOrder.length - 1; i >= 0; i--) {
      const k = reverseOrder[i];
      const found = reverseH[i];
      let change = -1;
      let xor = this.fingerprint(k);
      for (let hi = 0; hi < this.hashes; hi++) {
        const h = this.hash(k, this.seed, hi);
        if (found === hi) {
          change = h;
        } else {
          xor ^= this.fingerprints[h];
        }
      }
      this.fingerprints[change] = xor;
    }
  }

  mayContain(key) {
    const hash = key + this.seed;
    let f = this.fingerprint(hash);
    const h0 = this.hash(key, this.seed, 0);
    const h1 = this.hash(key, this.seed, 1);
    const h2 = this.hash(key, this.seed, 2);
    f ^= this.fingerprints[h0] ^ this.fingerprints[h1] ^ this.fingerprints[h2];
    return (f & 0xff) === 0;
  }
}
class BloomFilter {
  constructor(size, numHashes) {
    this.size = size;
    this.numHashes = numHashes;
    this.bits = new Uint8Array(size / 8);
    this.memo = new Map();
    this.seed = 12345; // Initialize seed value
  }
  add(element) {
    for (let i = 0; i < this.numHashes; i++) {
      const hashIdx = this.hash(element, i);
      this.bits[hashIdx >> 5] |= 1 << (hashIdx & 31);
    }
  }
  test(element) {
    if (this.memo.has(element)) {
      return this.memo.get(element);
    }
    // Call hash method with hashIndex 0 as an example (or use a loop for multiple hash functions)
    const hash = this.hash(element, 0);
    const low = 0;
    const high = this.size - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if ((this.bits[mid >> 5] & (1 << (mid & 31))) === 0) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    if (low === this.size) {
      return false;
    } else {
      this.memo.set(element, true);
      return true;
    }
  }
  hash(element, hashIndex) {
    let hash = element.charCodeAt(0) + this.seed * hashIndex; // Use this.seed
    for (let i = 1; i < element.length; i++) {
      hash = hash * this.seed + element.charCodeAt(i);
    }
    return hash % this.size;
  }
}
class Node {
  constructor() {
    this.key = null;
    this.value = null;
    this.prev = null;
    this.next = null;
  }
}

class ListNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
    this.head = new ListNode(null, null);
    this.tail = new ListNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const node = this.cache.get(key);
    this.moveToHead(node);
    return node.value;
  }
  put(key, value) {
    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this.moveToHead(node);
    } else {
      const node = { key, value, prev: null, next: null };
      this.cache.set(key, node);
      this.addToHead(node);
      if (this.cache.size > this.capacity) {
        this.cache.delete(this.tail.key);
        this.removeFromTail();
      }
    }
  }
  moveToHead(node) {
    if (node === this.head) return;
    this.removeFromList(node);
    this.addToHead(node);
  }
  addToHead(node) {
    node.next = this.head;
    node.prev = null;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }
  removeFromList(node) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
  }

  removeFromTail() {
    if (this.tail) this.tail = this.tail.prev;
    if (this.tail) this.tail.next = null;
  }
  getKeys() {
    return Array.from(this.cache.keys());
}}
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }

  insert(word) {
    let current = this;
    for (const ch of word) {
      if (!current.children.has(ch)) {
        current.children.set(ch, new TrieNode());
      }
      current = current.children.get(ch);
    }
    current.isEndOfWord = true;
  }

  search(word) {
    let current = this;
    for (const ch of word) {
      if (!current.children.has(ch)) {
        return false;
      }
      current = current.children.get(ch);
    }
    return current.isEndOfWord;
  }
}

// ##MAIN SCRIPT##
// Load the configuration from storage
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get('config', (storedData) => {
      const initialConfig = getInitialConfig();
      const config = storedData?.config || initialConfig;
      const substringTrie = new TrieNode();
      const bloomFilter = new BloomFilter(10000, 5);

      if (Array.isArray(config.FILTERED_SUBSTRINGS)) {
        config.FILTERED_SUBSTRINGS = config.FILTERED_SUBSTRINGS.join('\n').split('\n').map(s => s.trim());
        config.FILTERED_SUBSTRINGS.forEach((substring) => {
          substringTrie.insert(substring);
          bloomFilter.add(substring);
        });
      } else {
        console.error('config.FILTERED_SUBSTRINGS is not defined or not an array');
      }

      const xorFilter = new XORFilter(Array.from(config.FILTERED_SUBSTRINGS));
      const lruCache = new LRUCache(config.MAX_CACHE_SIZE);
      const simHashGenerator = new SimHashGenerator(config.FINGERPRINT_BITS);

      resolve({
        config,
        substringTrie,
        xorFilter,
        bloomFilter,
        lruCache,
        simHashGenerator
      });
    });
  });
}

// Get post elements from the page.
function getPostElements() {
  const postTables = document.querySelectorAll("table[width='700']");
  const posts = Array.from(postTables).map((postTable) => {
    const dateElement = postTable.querySelector("b");
    const dateStr = dateElement ? dateElement.nextSibling.textContent.trim() : null;
    const authorElement = postTable.querySelector("b+b");
    const author = authorElement ? authorElement.nextSibling.textContent.trim() : null;
    const contentElement = authorElement ? authorElement.nextElementSibling : null;
    const content = contentElement ? contentElement.textContent.trim() : null;
    const id = postTable.id;
    return { date: dateStr, author, content, id };
  }).filter(post => post.author && post.content);
  return posts;
}

// Hide an HTML element by its ID.
function hideElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = 'none';
  }
}

// Catch and log errors that occur in the extension.
function catchErrors() {
  window.addEventListener('error', (error) => {
    console.error('Error in extension:', error.message);
  });
}

// Filter out spam posts based on the loaded configuration.
async function filterSpamPosts() {
  const { config, substringTrie, xorFilter, bloomFilter, lruCache, simHashGenerator } = await loadConfig();
  const posts = getPostElements();
  posts.forEach((post) => {
    const { date: dateStr, author, content, id } = post;
    if (content.length < config.LONG_POST_THRESHOLD) {
      return;
    }
    // Apply substring-based filtering first.
    if (config.FILTERED_SUBSTRINGS.some((substring) => content.includes(substring))) {
      hideElementById(id);
      return;
    }
    // Apply the other advanced filtering methods.
    const simHash = BigInt(simHashGenerator.compute(content).join('')); // Convert to BigInt
    let isSpam = lruCache.getKeys().some((cachedSimHash) => {
      return simHashGenerator.hammingDistance(simHash, BigInt(cachedSimHash)) <= config.MAX_HAMMING_DISTANCE; // Ensure cachedSimHash is BigInt
    });
    if (!isSpam && xorFilter.mayContain(content)) {
      isSpam = true;
    }
    if (!isSpam && bloomFilter.test(simHash)) {
      isSpam = true;
    }
    lruCache.put(simHash.toString(), isSpam); // Cache as string, BigInt not supported in Map keys
    if (isSpam) {
      hideElementById(id);
    }
  });
}

filterSpamPosts();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, substring } = message;
  if (type === 'addUserFilteredSubstring') {
    if (typeof substring === 'string') { // Ensure substring is a string
      loadConfig().then(({ config }) => {
        config.FILTERED_SUBSTRINGS.push(substring);
        chrome.storage.local.set({ config }, () => {
          console.log(`Added user-defined substring "${substring}" to the filter list.`);
          sendResponse({ success: true });
        });
      });
      return true; // Indicate that the response is async.
    } else {
      sendResponse({ success: false }); // Indicate failure if substring is not a string
    }
  }
});

// Register a listener for changes in the configuration.
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.config) {
    // Re-run the filterSpamPosts function with the updated configuration.
    filterSpamPosts();
  }
});

// Run the catchErrors function to listen for errors.
catchErrors();