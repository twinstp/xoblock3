//##TESTS##
function testHammingDistance() {
    const hash1 = 0b11010101n;
    const hash2 = 0b10101010n;
    const expectedDistance = 7;
    const computedDistance = SimHashGenerator.hammingDistance(hash1, hash2);
    console.assert(computedDistance === expectedDistance, 'HammingDistance test failed');
  }
  
// Updated testSimHashAndFiltering method
async function testSimHashAndFiltering() {
  const content = 'This is a test message.';
  const simHashGen = new SimHashGenerator();
  const computedSimHash = simHashGen.compute(content);

  // Load the configuration
  const { config, substringTrie, xorFilter, bloomFilter, lruCache, simHashGenerator } = await loadConfig();

  let isFiltered = false;
  if (Array.isArray(config.FILTERED_SUBSTRINGS) && config.FILTERED_SUBSTRINGS.length > 0) {
    isFiltered = (await Promise.all([...config.FILTERED_SUBSTRINGS].map((substring) => {
      const precomputedSimHash = simHashGen.compute(substring);
      return SimHashGenerator.hammingDistance(computedSimHash, precomputedSimHash) <= config.MAX_HAMMING_DISTANCE;
    }))).some(Boolean);
  }
  console.assert(!isFiltered, 'SimHashAndFiltering test failed');
}
  async function testFilterShortOrEmptyPosts() {
    const config = await loadConfig();
    const emptyPost = '';
    const shortPost = 'Short!';
    const hideElementById = () => console.error('Empty or short post should not be filtered');
    await SimHashGenerator.filterSpamPosts(config, emptyPost, hideElementById);
    await SimHashGenerator.filterSpamPosts(config, shortPost, hideElementById);
    console.log('testFilterShortOrEmptyPosts passed');
  }
  
  async function testStorageLimitBehavior() {
    const config = { MAX_CACHE_SIZE: 5, MIN_CONTENT_LENGTH: 10, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: [] };
    const filteredSubstrings = new Set();
    const messageCache = new Set();
    const hideElementById = (id) => console.log(`Hiding post with ID: ${id}`);
    const samplePosts = ['Test post 1', 'Test post 2', 'Test post 3', 'Test post 4', 'Test post 5', 'Test post 6'];
    for (const post of samplePosts) {
      await SimHashGenerator.filterSpamPosts(config, post, hideElementById);
    }
    console.assert(messageCache.size <= config.MAX_CACHE_SIZE, 'testStorageLimitBehavior failed');
  }
  
  class SpamFilterTests {
    constructor() {
      this.simHashGen = new SimHashGenerator();
    }
  
    async runTests() {
      await this.testHammingDistance();
      await this.testSimHashAndFiltering();
      await this.testFilterShortOrEmptyPosts();
      await this.testStorageLimitBehavior();
      await this.testTrie();
      await this.testCacheEviction();
      await this.testSimHashWithNonEnglishText();
      await this.testSHA1();
      await this.testUserDefinedSubstringFiltering();
      await this.testServiceWorkerRegistration();
      await this.testTriePrefixWithNoMatches();
      await this.testTrieDuplicateSubstring();
      await this.testSubstringFiltering();
      await this.testSimHashFiltering();
      console.log('All tests passed.');
    }
  
    async testHammingDistance() {
      const hash1 = 0b11010101n;
      const hash2 = 0b10101010n;
      const expectedDistance = 7;
      const computedDistance = SimHashGenerator.hammingDistance(hash1, hash2);
      console.assert(computedDistance === expectedDistance, 'HammingDistance test failed');
    }
  
    async testSimHashAndFiltering() {
      const sampleText = "It's not a dysphoria. I see it in the positive way of working toward something, rather than away from something.";
      const computedSimHash = this.simHashGen.compute(sampleText);
      const config = await loadConfig();
      const isFiltered = (await Promise.all([...config.FILTERED_SUBSTRINGS].map((substring) => {
        const precomputedSimHash = this.simHashGen.compute(substring);
        return SimHashGenerator.hammingDistance(computedSimHash, precomputedSimHash) <= config.MAX_HAMMING_DISTANCE;
      }))).some(Boolean);
      console.assert(isFiltered, 'testSimHashAndFiltering failed');
    }
  
    async testFilterShortOrEmptyPosts() {
      const config = await loadConfig();
      const emptyPost = '';
      const shortPost = 'Short!';
      const hideElementById = () => console.error('Empty or short post should not be filtered');
      await SimHashGenerator.filterSpamPosts(config, emptyPost, hideElementById);
      await SimHashGenerator.filterSpamPosts(config, shortPost, hideElementById);
      console.log('testFilterShortOrEmptyPosts passed');
    }
  
    async testStorageLimitBehavior() {
      const config = { MAX_CACHE_SIZE: 5, MIN_CONTENT_LENGTH: 10, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: [] };
      const messageCache = new Set();
      const hideElementById = (id) => console.log(`Hiding post with ID: ${id}`);
      const samplePosts = ['Test post 1', 'Test post 2', 'Test post 3', 'Test post 4', 'Test post 5', 'Test post 6'];
      for (const post of samplePosts) {
        await SimHashGenerator.filterSpamPosts(config, post, hideElementById);
      }
      console.assert(messageCache.size <= config.MAX_CACHE_SIZE, 'testStorageLimitBehavior failed');
    }
  
    async testTrie() {
      const trie = new Trie();
      trie.insert("abc");
      trie.insert("abgl");
      trie.insert("abcdef");
      console.assert(!trie.search(""), 'Empty string test failed');
      console.assert(trie.search("abc") && trie.startsWith("ab") && !trie.search("abcf"), 'Search and startsWith test failed');
      const longString = "a".repeat(10000);
      trie.insert(longString);
      console.assert(trie.search(longString), 'Long string test failed');
    }
  
    async testCacheEviction() {
      const config = await loadConfig();
      const maxCacheSize = config.MAX_CACHE_SIZE || 500;
      const messageCache = new Set();
      const simHashFrequencies = new Map();
      for (let i = 1; i <= maxCacheSize + 5; i++) {
        const simHash = BigInt(i);
        messageCache.add(simHash);
        simHashFrequencies.set(simHash, 1);
        if (messageCache.size > maxCacheSize) {
          const leastFrequentHash = [...simHashFrequencies.entries()].sort((a, b) => a[1] - b[1])[0][0];
          messageCache.delete(leastFrequentHash);
          simHashFrequencies.delete(leastFrequentHash);
        }
      }
      console.assert(messageCache.size <= maxCacheSize, 'Cache eviction test failed');
    }
  
    async testSimHashWithNonEnglishText() {
      const nonEnglishCharPost = 'Test नमस्ते こんにちは 你好';
      const specialCharPost = 'Test !@#$%^&*()_+{}|:"<>?[]\\;\',./';
      const emojiPost = 'Test 😊🌟👍';
      const nonEnglishCharSimHash = this.simHashGen.compute(nonEnglishCharPost);
      const specialCharSimHash = this.simHashGen.compute(specialCharPost);
      const emojiSimHash = this.simHashGen.compute(emojiPost);
      console.assert(
        typeof nonEnglishCharSimHash === 'bigint' &&
        typeof specialCharSimHash === 'bigint' &&
        typeof emojiSimHash === 'bigint',
        'SimHash computation with non-English text test failed'
      );
    }
  
    async testSHA1() {
      const testCases = [
        { message: 'Hello World!', expectedHash: '2ef7bde608ce5404e97d5f042f95f89f1c232871' },
        { message: 'The quick brown fox jumps over the lazy dog', expectedHash: '23c4db6a5b362e96519f22a66987d019018dd06d' },
        { message: '', expectedHash: 'da39a3ee5e6b4b0d3255bfef95601890afd80709' }
      ];
      for (const { message, expectedHash } of testCases) {
        const computedHash = computeSHA1(message).toLowerCase();
        console.assert(computedHash === expectedHash, `SHA1 test failed for message: "${message}"`);
      }
    }
  
    async testUserDefinedSubstringFiltering() {
      const config = await loadConfig();
      const substringTrie = new Trie();
      const substring = "User-defined substring";
      addUserFilteredSubstring(substring, config);
      substringTrie.insert(substring);
      console.assert(substringTrie.search(substring), 'User-defined substring filtering test failed');
    }
  
    async testServiceWorkerRegistration() {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('service-worker.js');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    }
  
    async testTriePrefixWithNoMatches() {
      const trie = new Trie();
      trie.insert("apple");
      trie.insert("orange");
      trie.insert("banana");
      console.assert(!trie.startsWith("grape"),
      'Trie prefix test failed: Unexpected match');
    }
  
    async testTrieDuplicateSubstring() {
      const trie = new Trie();
      trie.insert("apple");
      trie.insert("apple");
      console.assert(trie.search("apple"), 'Trie duplicate substring test failed');
    }
  
    async testSubstringFiltering() {
      const config = { MAX_CACHE_SIZE: 10, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: ['SpamWord'] };
      const substringTrie = new Trie();
      config.FILTERED_SUBSTRINGS.forEach(substring => substringTrie.insert(substring));
      const mockMessageTable = createMockMessageTable('This is a SpamWord message', 'mockId');
      document.body.appendChild(mockMessageTable);
      const hideElementById = (id) => {
        const element = document.getElementById(id);
        if (element) {
          element.style.display = 'none';
        }
      };
      await SimHashGenerator.filterSpamPosts(config, substringTrie, mockMessageTable, hideElementById);
      const hiddenElement = document.getElementById('mockId');
      console.assert(hiddenElement.style.display === 'none', 'Substring filtering test failed');
      document.body.removeChild(mockMessageTable);
    }
  
    async testSimHashFiltering() {
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
      await SimHashGenerator.filterSpamPosts(config, substringTrie, messageCache, mockMessageTable1, hideElementById);
      await SimHashGenerator.filterSpamPosts(config, substringTrie, messageCache, mockMessageTable2, hideElementById);
      const hiddenElement = document.getElementById('mockId2');
      console.assert(hiddenElement.style.display === 'none', 'SimHash filtering test failed');
      document.body.removeChild(mockMessageTable1);
      document.body.removeChild(mockMessageTable2);
    }
  
    createMockMessageTable(content, id) {
      const table = document.createElement('table');
      table.id = id;
      const row = table.insertRow();
      const cell = row.insertCell();
      cell.textContent = content;
      return table;
    }
  }
  
  // Run the tests
  const spamFilterTests = new SpamFilterTests();
  spamFilterTests.runTests();