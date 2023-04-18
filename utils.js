// utils.js
// Utility functions extracted from the original content.js

// Load CryptoJS from the window object
const CryptoJS = window.CryptoJS;

// Define initial configuration
const initialConfig = {
  MAX_CACHE_SIZE: 500,
  MAX_HAMMING_DISTANCE: 3,
  FILTERED_SUBSTRINGS: []
};

// Utility function to load the configuration from chrome.storage.local
async function loadConfig() {
    let config = initialConfig;
    try {
      const storedConfig = await chrome.storage.local.get('config');
      config = storedConfig.config || initialConfig;
    } catch (error) {
      console.warn('Failed to load configuration from storage. Using initial configuration.');
    }
    return config;
}
  
// Utility function to tokenize a message
function tokenize(message) {
  return message.split(/\s+/);
}

// Utility function to compute SimHash of a message
function computeSimHash(message) {
  const tokenWeights = new Map();
  const tokens = tokenize(message);
  tokens.forEach((token) => {
    const weight = (tokenWeights.get(token) || 0) + 1;
    tokenWeights.set(token, weight);
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
    let x = hash1 ^ hash2;
    let count = 0;
    while (x) {
      count += x & BigInt(1);
      x >>= BigInt(1);
    }
    return count;
  }
  
// Filter logic (similar to the original filterSpamPosts function)
function filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById) {
    const MAX_CACHE_SIZE = config.MAX_CACHE_SIZE || 500;
    let cacheIndex = 0;
  
    // Select both posts and table of contents entries
    const messageTables = document.querySelectorAll("table[width='700'], table.threadlist tr");
  
    const postData = Array.from(messageTables)
    .filter(table => table.id || table.getAttribute('name'))
    .map(table => ({
      content: table.textContent.trim(),
      id: table.id || table.getAttribute('name')
    }));
  
    postData.forEach((post) => {
      const { content, id } = post;
      const joinedString = content.trim();
  
      // Ensure that only messages with more than 250 printable characters are filtered out
      if (joinedString.length <= 250) {
        return;
      }
  
      // Convert filteredSubstrings Set to Array and check if the post content matches any predefined substrstrings
      if ([...filteredSubstrings].some((substring) => joinedString.includes(substring))) {
          hideElementById(id); // Hide the element by its ID
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
          hideElementById(id); // Hide the element by its ID
        } else {
          // Update messageCache with the new SimHash
          messageCache[cacheIndex] = simHash;
          cacheIndex = (cacheIndex + 1) % MAX_CACHE_SIZE;
        }
      });
    }
      // Utility function to hide elements by ID
  function hideElementById(id) {
    const element = document.getElementById(id) || document.querySelector(`[name='${id}']`);
    if (element) {
      element.style.visibility = 'hidden';
      element.style.display = 'none';
      console.log(`Filtered element with ID ${id}.`);
    } else {
      console.warn(`Element with ID ${id} not found.`);
    }
  }
  
  // Function to allow users to update userFilteredSubstrings
  function addUserFilteredSubstring(substring, config, filteredSubstrings) {
    filteredSubstrings.add(substring);
    // Update the configuration in storage
    config.FILTERED_SUBSTRINGS = [...filteredSubstrings];
    chrome.storage.local.set({ config }, () => {
      console.log(`Added user-defined substring "${substring}" to the filter list.`);
    });
  }
  
  // Register a listener for the "addUserFilteredSubstring" message
  // This allows the background or options page to request the addition of a new substring to the filter
  function registerAddUserFilteredSubstringListener(config, filteredSubstrings) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'addUserFilteredSubstring' && message.substring) {
        addUserFilteredSubstring(message.substring, config, filteredSubstrings);
        sendResponse({ success: true });
      }
    });
  }
  
  // Invoke the filterSpamPosts function again to apply changes if the configuration is updated
  function registerConfigChangeListener(config, filteredSubstrings, messageCache, hideElementById) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.config) {
        // Update the local configuration and filtered substrings
        const newConfig = changes.config.newValue;
        Object.assign(config, newConfig);
        filteredSubstrings.clear();
        newConfig.FILTERED_SUBSTRINGS.forEach((substring) => filteredSubstrings.add(substring));
        // Re-run the filter
        filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById);
      }
    });
  }
  
  // Catch any errors that occur in the extension
  function catchErrors() {
    window.addEventListener('error', (error) => {
      console.error('Error in extension:', error.message);
    });
  }