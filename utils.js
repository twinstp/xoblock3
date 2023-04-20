const initialConfig = {
  MAX_CACHE_SIZE: 500,
  MAX_HAMMING_DISTANCE: 3,
  FILTERED_SUBSTRINGS: new Set(),
};

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

async function computeSHA1(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function computeSimHash(message) {
  const tokenWeights = new Map();
  const tokens = message.split(/\s+/);
  tokens.forEach((token) => {
    const weight = (tokenWeights.get(token) || 0) + 1;
    tokenWeights.set(token, weight);
  });
  const fingerprintBits = 32;
  const v = new Int32Array(fingerprintBits);
  const promises = [];
  for (const [token, weight] of tokenWeights.entries()) {
    promises.push(computeSHA1(token).then(hash => {
      const hashInt = parseInt(hash, 16);
      for (let i = 0; i < fingerprintBits; ++i) {
        v[i] += (hashInt >> i) & 1 ? weight : -weight;
      }
    }));
  }
  return Promise.all(promises).then(() => {
    let simHash = 0;
    for (let i = 0; i < fingerprintBits; ++i) {
      if (v[i] > 0) {
        simHash |= 1 << i;
      }
    }
    return simHash;
  });
}

function hammingDistance(hash1, hash2) {
  let xor = hash1 ^ hash2;
  let distance = 0;
  while (xor) {
    distance += xor & 1;
    xor >>= 1;
  }
  return distance;
}

function filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById) {
  const MAX_CACHE_SIZE = config.MAX_CACHE_SIZE || 500;
  const messageTables = document.querySelectorAll("table[width='700'][id], table.threadlist tr[name]");
  const simHashFrequencies = new Map();
  const computePromises = [];
  for (const table of messageTables) {
    const content = table.textContent.trim();
    const id = table.id || table.getAttribute('name');
    if (content.length <= 250) continue;
    if (config.FILTERED_SUBSTRINGS.has(content)) {
      hideElementById(id);
      continue;
    }
    computePromises.push(computeSimHash(content).then(simHash => {
      if (!simHash) return;
      const similarHash = [...messageCache.keys()].find(cachedHash =>
        hammingDistance(simHash, cachedHash) <= config.MAX_HAMMING_DISTANCE
      );
      if (similarHash) {
        hideElementById(id);
        simHashFrequencies.set(similarHash, simHashFrequencies.get(similarHash) + 1);
      } else {
        messageCache.add(simHash);
        simHashFrequencies.set(simHash, 1);
      }
      if (messageCache.size > MAX_CACHE_SIZE) {
        const leastFrequentHash = [...simHashFrequencies.entries()].sort((a, b) => a[1] - b[1])[0][0];
        messageCache.delete(leastFrequentHash);
        simHashFrequencies.delete(leastFrequentHash);
      }
    }));
  }
  return Promise.all(computePromises);
}

function hideElementById(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = 'none';
  }
}

function addUserFilteredSubstring(substring, config) {
  config.FILTERED_SUBSTRINGS.add(substring);
  chrome.storage.local.set({
    config: {
      ...config,
      FILTERED_SUBSTRINGS: [...config.FILTERED_SUBSTRINGS],
    },
  }, () => {
    console.log(`Added user-defined substring "${substring}" to the filter list.`);
  });
}

function registerAddUserFilteredSubstringListener(config, filteredSubstrings) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
      addUserFilteredSubstring(message.substring, config);
      sendResponse({ success: true });
    }
  });
}

function registerConfigChangeListener(config, filteredSubstrings, messageCache, hideElementById) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.config) {
      const newConfig = changes.config.newValue;
      Object.assign(config, newConfig);
      filteredSubstrings.clear();
      newConfig.FILTERED_SUBSTRINGS.forEach((substring) => filteredSubstrings.add(substring));
      console.log('Updated configuration from storage:', newConfig);
      filterSpamPosts(config, filteredSubstrings, messageCache, hideElementById);
    }
  });
}

function catchErrors() {
  window.addEventListener('error', (error) => {
    console.error('Error in extension:', error.message);
  });
}

function testHammingDistance() {
  const hash1 = 0b11010101;
  const hash2 = 0b10101010;
  const expectedDistance = 5;
  const computedDistance = hammingDistance(hash1, hash2);
  if (computedDistance === expectedDistance) {
    console.log('hammingDistance test passed');
  } else {
    console.error(`hammingDistance test failed: expected ${expectedDistance}, got ${computedDistance}`);
  }
}

testHammingDistance();