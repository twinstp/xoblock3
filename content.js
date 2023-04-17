(async function () {
  'use strict';

  // Load the crypto-js library from the extension's local directory
  const cryptoJsScript = document.createElement('script');
  cryptoJsScript.src = chrome.runtime.getURL('crypto-js.min.js');

  // Log when the script has loaded successfully
  cryptoJsScript.onload = () => {
    console.log('crypto-js script loaded successfully');
  };

  // Log and handle errors if the script fails to load
  cryptoJsScript.onerror = (error) => {
    console.error('Failed to load crypto-js script:', error);
  };

  document.head.appendChild(cryptoJsScript);

  // Wait for the script to load before proceeding
  await new Promise((resolve) => (cryptoJsScript.onload = resolve));

  // Load the configuration from config.json
  const config = await fetch(chrome.runtime.getURL('config.json')).then((response) => response.json());
  console.log('Loaded config:', config);

  // Convert FILTERED_SUBSTRINGS and USER_FILTERED_SUBSTRINGS to Sets for faster lookup
  config.FILTERED_SUBSTRINGS = new Set(config.FILTERED_SUBSTRINGS);
  config.USER_FILTERED_SUBSTRINGS = new Set();

  // Utility function to tokenize a message
  function tokenize(message) {
    return message.split(/\s+/);
  }

  // Test for tokenize function
  console.log('Tokenize test:', JSON.stringify(tokenize('Hello World')) === JSON.stringify(['Hello', 'World']));

  // Utility function to compute SimHash of a message
  function computeSimHash(message) {
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
    const x = hash1 ^ hash2;
    return x.toString(2).split('').filter((bit) => bit === '1').length;
  }

  // Test for hammingDistance function
  console.log('Hamming distance test:', hammingDistance(BigInt('0b1001'), BigInt('0b1100')) === 2);

  // Function to check if a message is similar to any in the cache
  function isSimilarToCachedMessages(hash, messageCache) {
    return Array.from(messageCache.keys()).some(
      (cachedHash) => hammingDistance(hash, cachedHash) <= config.MAX_HAMMING_DISTANCE
    );
  }

  // Regular expression used in extractText function (updated to handle both http and https)
  const extractTextRegex = /\(https?:\/\/www\.autoadmit\.com\/thread\.php\?thread_id=\d+&forum_id=\d+#\d+\)$/;

  // Function to extract text content from a post
  function extractText(input) {
    if (extractTextRegex.test(input)) {
      return input.replace(extractTextRegex, '').trim();
    }
    if (input.startsWith(')')) {
      input = input.substring(1);
    }
    return input;
  }

  // Test for extractText function (updated to match new regex)
  console.log(
    'Extract text test:',
    extractText('(https://www.autoadmit.com/thread.php?thread_id=12345&forum_id=2#123) Some text') === 'Some text'
  );

  // Function to filter out spam posts from the current page view
  async function filterSpamPosts() {
    const messageCache = new Map();
    const messageTables = document.querySelectorAll("table[width='700']");
    for (const table of messageTables) {
      if (table.getAttribute('cellspacing')) {
        continue;
      }
      const bodyElement = table.querySelector('table font');
      if (!bodyElement) {
        continue;
      }
      let authorDetected = false;
      const bodyStrings = [];
      for (const child of bodyElement.childNodes) {
        const textContent = child.textContent?.trim();
        if (textContent) {
          if (!authorDetected) {
            if (textContent.startsWith('Author:')) {
              authorDetected = true;
            }
            continue;
          }
          bodyStrings.push(extractText(textContent));
        }
      }
      const joinedString = bodyStrings.join('');
      // Check if the post content matches any predefined or user-defined substrings
      const filteredSubstrings = Array.from(
        new Set([...config.FILTERED_SUBSTRINGS, ...config.USER_FILTERED_SUBSTRINGS])
      );
      const isSpamBySubstring = filteredSubstrings.some((substring) =>
        joinedString.includes(substring)
      );
      const simHash = computeSimHash(joinedString);
      const isSpamBySimHash = isSimilarToCachedMessages(simHash, messageCache);
      if (isSpamBySubstring || isSpamBySimHash) {
        console.log('Hiding spam post:', joinedString);
        table.style.visibility = 'hidden';
        table.style.display = 'none';
        continue;
      }
      // Update cache with the new hash
      messageCache.set(simHash, 1);
      // Remove the oldest entry if cache size exceeds the limit
      if (messageCache.size > config.MAX_CACHE_SIZE) {
        const oldestHash = messageCache.keys().next().value;
        messageCache.delete(oldestHash);
      }
    }
  }

  // Invoke the filterSpamPosts function to start filtering
  await filterSpamPosts();

  // Function to allow users to update userFilteredSubstrings
  function addUserFilteredSubstring(substring) {
    config.USER_FILTERED_SUBSTRINGS.add(substring);
  }
})();