async function loadConfig() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('config', (storedData) => {
      const config = storedData?.config || getInitialConfig();
      resolve(config);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfig().then(config => {
    document.getElementById('max-cache-size').value = config.MAX_CACHE_SIZE;
    document.getElementById('max-hamming-distance').value = config.MAX_HAMMING_DISTANCE;
    document.getElementById('long-post-threshold').value = config.LONG_POST_THRESHOLD;
    document.getElementById('filtered-substrings').value = config.FILTERED_SUBSTRINGS.join(', ');
  }).catch(error => {
    console.error('Failed to load configuration:', error);
  });

  document.getElementById('save-config').addEventListener('click', () => {
    const maxCacheSize = parseInt(document.getElementById('max-cache-size').value, 10);
    const maxHammingDistance = parseInt(document.getElementById('max-hamming-distance').value, 10);
    const longPostThreshold = parseInt(document.getElementById('long-post-threshold').value, 10);
    const filteredSubstrings = document.getElementById('filtered-substrings').value.split(',').map(s => s.trim());
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