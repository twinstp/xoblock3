// settings.js

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

async function loadConfig() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('config', (storedData) => {
      const config = storedData?.config || getInitialConfig();
      resolve(config);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfig()
    .then((config) => {
      document.getElementById('max-cache-size').value = config.MAX_CACHE_SIZE;
      document.getElementById('max-hamming-distance').value = config.MAX_HAMMING_DISTANCE;
      document.getElementById('long-post-threshold').value = config.LONG_POST_THRESHOLD;
      document.getElementById('filtered-substrings').value = config.FILTERED_SUBSTRINGS.join('\n'); // Use newline as the separator
    })
    .catch((error) => {
      console.error('Failed to load configuration:', error);
    });

  document.getElementById('save-config').addEventListener('click', () => {
    const maxCacheSize = parseInt(document.getElementById('max-cache-size').value, 10);
    const maxHammingDistance = parseInt(document.getElementById('max-hamming-distance').value, 10);
    const longPostThreshold = parseInt(document.getElementById('long-post-threshold').value, 10);
    const filteredSubstrings = document.getElementById('filtered-substrings').value.split('\n').map((s) => s.trim());
    const newConfig = {
      MAX_CACHE_SIZE: maxCacheSize,
      MAX_HAMMING_DISTANCE: maxHammingDistance,
      LONG_POST_THRESHOLD: longPostThreshold,
      FILTERED_SUBSTRINGS: filteredSubstrings
    };
    chrome.storage.local.set({ config: newConfig }, () => {
      console.log('Configuration updated:', newConfig);
      alert('Configuration saved successfully.');
    });
  });
});