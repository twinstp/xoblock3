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

  // Define initial configuration
  const initialConfig = {
    MAX_CACHE_SIZE: 500,
    MAX_HAMMING_DISTANCE: 3,
    FILTERED_SUBSTRINGS: [
      "modification, and he recently agreed to answer our questions",
      "legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago",
      "America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling",
      "Go to the link, and look at that woman. Look at that face. She never expressed any remorse over",
      "destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess."
    ]
  };

  // Load the configuration from chrome.storage.local, or use initialConfig as a fallback
  let config;
  try {
    const storedConfig = await new Promise((resolve) => chrome.storage.local.get('config', resolve));
    config = storedConfig.config || initialConfig;
  } catch (error) {
    console.warn('Failed to load configuration from storage. Using initial configuration.');
    config = initialConfig;
  }

  // Set for storing filtered substrings
  const filteredSubstrings = new Set([...config.FILTERED_SUBSTRINGS]);

  // Utility function to tokenize a message
  function tokenize(message) {
    return message.split(/\s+/);
  }

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

  // Initialize messageCache and cacheIndex
  const messageCache = [];
  let cacheIndex = 0;
  const MAX_CACHE_SIZE = Math.max(config.MAX_CACHE_SIZE || 500, 1);
  const filteredIds = [];

  // Filter logic (similar to the original filterSpamPosts function)
  function filterSpamPosts() {
    const messageTables = document.querySelectorAll("table[width='700']");
    const postData = Array.from(messageTables).map(table => ({
      content: table.innerText.trim(),
      id: table.id
    }));

    postData.forEach((post) => {
      const { content, id } = post;
      const joinedString = content.trim();

    // Ensure that only messages with more than 250 printable characters are filtered out
    if (joinedString.length <= 250) {
      return;
    }

    // Convert filteredSubstrings Set to Array and check if the post content matches any predefined substrings
    if ([...filteredSubstrings].some((substring) => joinedString.includes(substring))) {
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
      } else {
        // Update messageCache with the new SimHash
        messageCache[cacheIndex] = simHash;
        cacheIndex = (cacheIndex + 1) % MAX_CACHE_SIZE;
      }
    });

    // Hide filtered posts
    filteredIds.forEach((id) => {
      const table = document.getElementById(id);
      if (table) {
        table.style.visibility = 'hidden';
        table.style.display = 'none';
        console.log(`Filtered post with ID ${id}.`);
      } else {
        console.warn(`Element with ID ${id} not found.`);
      }
    });
  }

  // Invoke the filterSpamPosts function to start filtering
  filterSpamPosts();

  // Function to allow users to update userFilteredSubstrings
  function addUserFilteredSubstring(substring) {
    filteredSubstrings.add(substring);
    // Update the configuration in storage
    config.FILTERED_SUBSTRINGS = [...filteredSubstrings];
    chrome.storage.local.set({ config }, () => {
      console.log(`Added user-defined substring "${substring}" to the filter list.`);
    });
  }
    
  // Register a listener for the "addUserFilteredSubstring" message
  // This allows the background or options page to request the addition of a new substring to the filter
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
      addUserFilteredSubstring(message.substring);
      sendResponse({ success: true });
    }
  });
    
  // Invoke the filterSpamPosts function again to apply changes if the configuration is updated
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.config) {
      // Update the local configuration and filtered substrings
      config = changes.config.newValue;
      filteredSubstrings.clear();
      config.FILTERED_SUBSTRINGS.forEach((substring) => filteredSubstrings.add(substring));
      // Re-run the filter
      filterSpamPosts();
    }
  });
  
})().catch((error) => {
  console.error('Error in extension:', error.message);
});