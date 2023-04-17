(function() {
    'use strict';
  
    // Configuration settings
    const config = {
      MAX_CACHE_SIZE: 500,
      MAX_HAMMING_DISTANCE: 3,
      FILTERED_SUBSTRINGS: [
        'modification, and he recently agreed to answer our questions',
        'legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago',
        'America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling',
        'Go to the link, and look at that woman. Look at that face. She never expressed any remorse over',
        'destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess.'
      ],
      USER_FILTERED_SUBSTRINGS: []
    };
  
    // Utility function to tokenize a message
    function tokenize(message) {
      return message.split(/\s+/);
    }
  
    // Utility function to compute SimHash of a message
    function computeSimHash(message) {
      const tokenWeights = new Map();
      const tokens = tokenize(message);
      tokens.forEach(token => {
        const weight = tokenWeights.get(token) || 0;
        tokenWeights.set(token, weight + 1);
      });
  
      const fingerprintBits = 64;
      const v = new Int32Array(fingerprintBits);
      tokenWeights.forEach((weight, token) => {
        const hash = parseInt(crypto.subtle.digest('SHA-1', new TextEncoder().encode(token))
          .then(hashBuffer => Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('')), 16);
        for (let i = 0; i < fingerprintBits; ++i) {
          v[i] += (hash >> i) & 1 ? weight : -weight;
        }
      });
  
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
      const x = hash1 ^ hash2;
      return x.toString(2).split('').filter(bit => bit === '1').length;
    }
  
    // Function to check if a message is similar to any in the cache
    function isSimilarToCachedMessages(hash, messageCache) {
      for (const cachedHash of messageCache.keys()) {
        if (hammingDistance(hash, cachedHash) <= config.MAX_HAMMING_DISTANCE) {
          return true;
        }
      }
      return false;
    }
  
    // Main function to check messages and filter out spam
    function checkAndFilterMessage(message, postElement, postId, messageCache) {
      // Check for specific substrings
      const filteredSubstrings = config.FILTERED_SUBSTRINGS.concat(config.USER_FILTERED_SUBSTRINGS);
      for (const substring of filteredSubstrings) {
        if (message.includes(substring)) {
          return true; // Indicate that the post should be removed
        }
      }
  
      // Compute SimHash and check for repeated or similar messages
      const simHash = computeSimHash(message);
      if (isSimilarToCachedMessages(simHash, messageCache)) {
        return true; // Indicate that the post should be removed
    } else {
      // Update cache with the new hash
      messageCache.set(simHash, 1);
      // Remove the oldest entry if cache size exceeds the limit
      if (messageCache.size > config.MAX_CACHE_SIZE) {
        const oldestHash = messageCache.keys().next().value;
        messageCache.delete(oldestHash);
      }
    }
    return false; // Indicate that the post should not be removed
  }

  // Utility function to check if a string contains only whitespace
  function isAllWhitespace(text) {
    return /^\s*$/.test(text);
  }

  // Function to extract text content from a post
  function extractText(input) {
    const regex = /\(http:\/\/www\.autoadmit\.com\/thread\.php\?thread_id=\d+&forum_id=\d+#\d+\)$/;
    if (regex.test(input)) {
      return input.replace(regex, '').trim();
    }
    if (input.startsWith(')')) {
      input = input.substring(1);
    }
    return input;
  }

  // Function to filter out spam posts from the current page view
  function filterSpamPosts() {
    const messageCache = new Map();
    const messageTables = document.querySelectorAll("table[width='700']");
    for (const table of messageTables) {
      const cellspacing = table.getAttribute('cellspacing') ? 'cellspacing' : null;
      if (cellspacing) {
        continue;
      }
      const bodyElement = table.querySelector('table font');
      if (!bodyElement) {
        continue;
      }
      let authorDetected = false;
      const bodyStrings = [];
      for (const child of bodyElement.childNodes) {
        if (child.textContent && !isAllWhitespace(child.textContent)) {
          const textContent = child.textContent;
          if (!authorDetected) {
            if (textContent.startsWith('Author:')) {
              authorDetected = true;
            }
            continue;
          }
          bodyStrings.push(extractText(child.textContent));
        }
      }
      const joinedString = bodyStrings.join('');
      // Check if the post content matches any predefined or user-defined substrings
      const isSpam = checkAndFilterMessage(joinedString, table, null, messageCache);
      if (isSpam) {
        table.style.visibility = 'hidden';
        table.style.display = 'none';
      }
    }
  }

  // Invoke the filterSpamPosts function to start filtering
  filterSpamPosts();

  // Function to allow users to update userFilteredSubstrings
  function addUserFilteredSubstring(substring) {
    config.USER_FILTERED_SUBSTRINGS.push(substring);
  }
})();