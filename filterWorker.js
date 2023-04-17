// filterWorker.js
self.onmessage = (event) => {
    const { postData, config, filteredSubstrings } = event.data;
      
    // Load the crypto-js library in the worker using the provided URL
    self.importScripts(cryptoJsUrl);
  
    // Utility function to tokenize a message
    function tokenize(message) {
      return message.split(/\s+/);
    }
  
    // Utility function to compute SimHash of a message
    function computeSimHash(message) {
      if (typeof BigInt === 'undefined') {
        // BigInt is not supported, handle accordingly
        return null;
      }
  
      const tokenWeights = new Map();
      const tokens = tokenize(message);
      tokens.forEach((token) => {
        const weight = tokenWeights.get(token) || 0;
        tokenWeights.set(token, weight + 1);
      });
  
      const fingerprintBits = 64;
      const v = new Int32Array(fingerprintBits);
      for (const [token, weight] of tokenWeights.entries()) {
        const hash = BigInt('0x' + CryptoJS.SHA1(token).toString());
        for (let i = 0; i < fingerprintBits; ++i) {
          v[i] += (hash >> BigInt(i)) & BigInt(1) ? weight : -weight;
        }
      }
  
      let simHash = BigInt(0);
      for (let i = 0; i < fingerprintBits; ++i) {
        if (v[i] > 0) {
          simHash |= BigInt(1) << BigInt(i);
        }
      }
      return simHash;
    }
  
    // Utility function to calculate Hamming distance between two SimHashes
    function hammingDistance(hash1, hash2) {
      if (typeof BigInt === 'undefined') {
        // BigInt is not supported, handle accordingly
        return null;
      }
  
      const x = hash1 ^ hash2;
      return x.toString(2).split('').filter((bit) => bit === '1').length;
    }
  
    // Initialize messageCache and cacheIndex
    const messageCache = [];
    let cacheIndex = 0;
    const MAX_CACHE_SIZE = config.MAX_CACHE_SIZE || 500; // Set default value if not provided
    const filteredIds = [];
  
    // Filter logic (similar to the original filterSpamPosts function)
    postData.forEach((post) => {
      const { content, id } = post;
      const joinedString = content.trim();
  
      // Ensure that only messages with more than 250 printable characters are filtered out
      if (joinedString.length <= 250) {
        return;
      }
  
      // Check if the post content matches any predefined substrings
      if (filteredSubstrings.some((substring) => joinedString.includes(substring))) {
        filteredIds.push(id); // Store the ID of the filtered post
        return; // Exit early from the loop
      }
  
      // Compute the SimHash of the post content
      const simHash = computeSimHash(joinedString);
      if (!simHash) {
        // If simHash is null (BigInt not supported), skip this iteration
        return;
      }
  
      // Check if the SimHash is similar to any cached SimHashes based on a threshold MAX_HAMMING_DISTANCE
      const isSpamBySimHash = messageCache.some(
        (cachedHash) => hammingDistance(simHash, cachedHash) <= config.MAX_HAMMING_DISTANCE
      );
      if (isSpamBySimHash) {
        filteredIds.push(id); // Store the ID of the filtered post
      } else
      {
        // Update messageCache with the new SimHash
        messageCache[cacheIndex] = simHash;
        cacheIndex = (cacheIndex + 1) % MAX_CACHE_SIZE;
      
        // Ensure the cache size does not exceed the limit
        if (messageCache.length > MAX_CACHE_SIZE) {
          messageCache.shift();
        }
      }
    });

    // Send the filtered IDs back to the main script
    self.postMessage({ filteredIds });
};