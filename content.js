'use strict';
// ## DATA STRUCTURES ##
class XORFilter {
  constructor(keys, seed = 123456789) {
    this.fingerprintSize = 8;
    this.hashes = 3;
    this.seed = seed;
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
    this.bits = new Uint8Array(Math.floor(size / 8));
    this.seed = 12345;
  }

  add(element) {
    for (let i = 0; i < this.numHashes; i++) {
      const hashIdx = this.hash(element, i);
      this.bits[hashIdx >> 5] |= 1 << (hashIdx & 31);
    }
  }

  test(element) {
    for (let i = 0; i < this.numHashes; i++) {
      const hashIdx = this.hash(element, i);
      if ((this.bits[hashIdx >> 5] & (1 << (hashIdx & 31))) === 0) {
        return false;
      }
    }
    return true;
  }

  hash(element, hashIndex) {
    if (!element) {
      return 0;
    }
    let hash = this.seed * hashIndex;
    for (const char of [...element]) {
      hash = hash * this.seed + char.charCodeAt(0);
    }
    return hash % this.size;
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
      const node = new ListNode(key, value);
      this.cache.set(key, node);
      this.addToHead(node);
      if (this.cache.size > this.capacity) {
        this.cache.delete(this.tail.prev.key);
        this.removeFromTail();
      }
    }
  }

  moveToHead(node) {
    this.removeFromList(node);
    this.addToHead(node);
  }

  addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  removeFromList(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  removeFromTail() {
    this.removeFromList(this.tail.prev);
  }

  getKeys() {
    return Array.from(this.cache.keys());
  }
}

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
    if (!word) {
      return false;
    }
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
// ServiceWorker (for computing SHA1 and simhash)
class WorkerManager {
  constructor() {
    this.initializeWorker();
  }

  initializeWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then(() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Service worker is now active
        });
      });
    }
  }

  computeSHA1(message) {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('Service worker is not active'));
        return;
      }
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.action === 'computeDigest') {
          resolve(event.data.hash);
        }
      };
      navigator.serviceWorker.controller.postMessage(
        { action: 'computeDigest', token: message },
        [messageChannel.port2]
      );
    });
  }

  computeSimHash(content) {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('Service worker is not active'));
        return;
      }
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.action === 'computeSimHash') {
          resolve(event.data.hash);
        }
      };
      navigator.serviceWorker.controller.postMessage(
        { action: 'computeSimHash', content },
        [messageChannel.port2]
      );
    });
  }
}

const workerManager = new WorkerManager();

class ConfigurationManager {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.loadConfig().then((config) => {
      this.config = config;
    });
  }
  getInitialConfig() {
    return {
      MAX_CACHE_SIZE: 1000,
      MAX_HAMMING_DISTANCE: 5,
      LONG_POST_THRESHOLD: 25,
      FILTERED_SUBSTRINGS: [
        'modification, and herecently agreed to answer our questions',
        'legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago',
        'America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling',
        'Go to the link, and look at that woman. Look at that face. She never expressed any remorse over',
        'destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess.',
      ],
      USER_HIDDEN_AUTHORS: [],
    };
  }
  async loadConfig() {
    console.log('Loading config...');
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('config', (storedData) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          this.config = storedData?.config || this.getInitialConfig();
          resolve(this.config);
        }
      });
    });
  }
  saveConfig(newConfig) {
    chrome.storage.local.set({ config: newConfig }, () => {
      console.log('Configuration updated:', newConfig);
      alert('Configuration saved successfully.');
    });
  }
  setupDOMBindings() {
    document.addEventListener('DOMContentLoaded', () => {
      const config = this.config;
      document.getElementById('max-cache-size').value = config.MAX_CACHE_SIZE;
      document.getElementById('max-hamming-distance').value = config.MAX_HAMMING_DISTANCE;
      document.getElementById('long-post-threshold').value = config.LONG_POST_THRESHOLD;
      document.getElementById('filtered-substrings').value = config.FILTERED_SUBSTRINGS.join('\n');
      document.getElementById('hidden-authors').value = config.USER_HIDDEN_AUTHORS.join('\n');
      document.getElementById('save-config').addEventListener('click', () => {
        const maxCacheSize = parseInt(document.getElementById('max-cache-size').value,         10);
        const maxHammingDistance = parseInt(document.getElementById('max-hamming-distance').value, 10);
        const longPostThreshold = parseInt(document.getElementById('long-post-threshold').value, 10);
        const filteredSubstrings = document.getElementById('filtered-substrings').value.split('\n').map((s) => s.trim());
        const userHiddenAuthors = document.getElementById('hidden-authors').value.split('\n').map((s) => s.trim());
        const newConfig = {
          MAX_CACHE_SIZE: maxCacheSize,
          MAX_HAMMING_DISTANCE: maxHammingDistance,
          LONG_POST_THRESHOLD: longPostThreshold,
          FILTERED_SUBSTRINGS: filteredSubstrings,
          USER_HIDDEN_AUTHORS: userHiddenAuthors,
        };
        this.saveConfig(newConfig);
      });
    });
  }
}

class FilterManager {
  constructor(config) {
    this.config = config;
    this.substringTrie = new TrieNode();
    this.authorTrie = new TrieNode(); // Initialize a Trie to store blocked authors
    this.bloomFilter = new BloomFilter(10000, 5);
    this.xorFilter = null;
    this.lruCache = new LRUCache(config.MAX_CACHE_SIZE);
    this.initializeFilters();
  }
  async initializeFilters() {
    if (Array.isArray(this.config.FILTERED_SUBSTRINGS)) {
      const filteredHashes = await Promise.allSettled(
        this.config.FILTERED_SUBSTRINGS.map(async (substring) => {
          return await workerManager.computeSHA1(substring);
        })
      );
      // Use only the fulfilled promises to create the XOR filter
      const fulfilledHashes = filteredHashes
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
      this.xorFilter = new XORFilter(fulfilledHashes);
      this.config.FILTERED_SUBSTRINGS.forEach((substring) => {
        this.substringTrie.insert(substring);
        this.bloomFilter.add(substring);
      });
      console.log('Loaded FILTERED_SUBSTRINGS:', this.config.FILTERED_SUBSTRINGS);
    } else {
      console.error('config.FILTERED_SUBSTRINGS is not defined or not an array');
    }
    if (Array.isArray(this.config.USER_HIDDEN_AUTHORS)) {
      this.config.USER_HIDDEN_AUTHORS.forEach((author) => {
        this.authorTrie.insert(author);
      });
    }
  }
}

class PostParser {
  constructor() { }
  isAllWhitespace(text) {
    return /^\s*$/.test(text);
  }
  extractText(input) {
    const regex = /\(http:\/\/www\.autoadmit\.com\/thread\.php\?thread_id=\d+&forum_id=\d+#\d+\)$/;
    return input.replace(regex, '').replace(/^\)/, '').trim();
  }
  extractResponses(parent, parentResponse = null, visitedNodes = new Set()) {
    const responseEntries = [];
    parent.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      const responseId = anchor.getAttribute('href').slice(1);
      const content = anchor.textContent.trim();
      if (responseId === 'top' || visitedNodes.has(responseId)) {
        return;
      }
      visitedNodes.add(responseId);
      const responseEntry = { responseNumber: responseId, content, parentResponse };
      responseEntries.push(responseEntry);
      const nextTable = anchor.nextElementSibling;
      if (nextTable && nextTable.tagName === 'TABLE') {
        responseEntries.push(...this.extractResponses(nextTable, responseId, visitedNodes));
      }
    });
    return responseEntries;
  }
  extractHierarchicalStructure() {
    const pageContent = document.documentElement.innerHTML;
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(pageContent, 'text/html');
    return this.extractResponses(parsedDoc.body);
  }
  getPostElements() { 
    const messageTables = document.querySelectorAll("table[width='700']");
    const posts = [...messageTables].filter((table) => !table.hasAttribute("cellspacing")).map((table) => {
      // Locate the <b> elements in the table
      const bElements = table.querySelectorAll("b");
      // Find the "Author:" element and extract the author
      const authorElement = Array.from(bElements).find((b) => b.textContent.trim() === 'Author:');
      const author = authorElement ? authorElement.nextSibling.textContent.trim() : null;
      // Find the "Date:" element and extract the date
      const dateElement = Array.from(bElements).find((b) => b.textContent.trim() === 'Date:');
      const dateStr = dateElement ? dateElement.nextSibling.textContent.trim() : null;
      // Extract the post content
      const bodyElement = table.querySelector("table font");
      const bodyStrings = [];
      let authorDetected = false;
      for (const child of bodyElement.childNodes) {
        const textContent = child.textContent.trim();
        if (textContent.startsWith("Author:")) {
          authorDetected = true;
          continue;
        }
        if (authorDetected && !this.isAllWhitespace(textContent)) {
          bodyStrings.push(this.extractText(textContent));
        }
      }
      const content = bodyStrings.join("");
      const id = table.querySelector("a[name]")?.getAttribute("name");
      if (!author || !dateStr || !content) {
        return null;
      }
      return { date: dateStr, author, content, id, postTable: table };
    }).filter(Boolean);
    return posts;
  }
}

class ContentFilter {
  constructor() {
    this.configManager = new ConfigurationManager();
    this.postParser = new PostParser();
    this.configManager.loadConfig().then((config) => {
      this.filterManager = new FilterManager(config);
      this.filterPostsBySubstrings();
      this.filterSpamPostsBySimHash();
    });
  }

  createSpoiler(content) {
    const spoiler = document.createElement('div');
    spoiler.classList.add('spoiler');
    const spoilerButton = document.createElement('span');
    spoilerButton.classList.add('spoiler-button');
    spoilerButton.textContent = 'Click to reveal';
    spoiler.appendChild(spoilerButton);
    const spoilerContent = document.createElement('span');
    spoilerContent.classList.add('spoiler-content');
    spoilerContent.textContent = content;
    spoiler.appendChild(spoilerContent);
    spoilerContent.style.display = 'none';
    return spoiler;
  }

  filterPostsBySubstrings() {
    const posts = this.postParser.getPostElements();
    for (const post of posts) {
      const { content, postTable } = post;
      if (
        this.filterManager &&
        this.filterManager.bloomFilter &&
        this.filterManager.bloomFilter.test(content) &&
        this.filterManager.substringTrie.search(content)
      ) {
        const spoiler = this.createSpoiler(content);
        postTable.replaceChild(spoiler, postTable.querySelector('table font'));
      }
    }
  }

  filterSpamPostsBySimHash() {
    if (!this.filterManager) {
      return; // filterManager not yet initialized
    }
    const posts = this.postParser.getPostElements();
    const longPosts = posts.filter(
      (post) => post.content.length >= this.filterManager.config.LONG_POST_THRESHOLD
    );
    longPosts.forEach((post) => {
      const { content, postTable } = post;
      // Create a MessageChannel to communicate with the service worker
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data.action === 'computeSimHash') {
          const simHash = event.data.hash;
          const isSpam = this.filterManager.lruCache.getKeys().some((cachedSimHash) => {
            return SimHashUtil.hammingDistance(simHash, cachedSimHash) <= this.filterManager.config.MAX_HAMMING_DISTANCE;
          });
          if (isSpam) {
            const spoiler = this.createSpoiler(content);
            postTable.replaceChild(spoiler, postTable.querySelector('table font'));
          } else {
            this.filterManager.lruCache.put(simHash, true);
          }
        }
      };
      // Post a message to the service worker using the MessageChannel
      navigator.serviceWorker.controller.postMessage(
        { action: 'computeSimHash', content },
        [messageChannel.port2]
      );
    });
  }
}

const contentFilter = new ContentFilter();