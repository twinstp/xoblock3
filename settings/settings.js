// settings.js
document.addEventListener('DOMContentLoaded', () => {
  if (chrome.storage) {
    // Use chrome.storage.local if it's available
    chrome.storage.local.get('config', (storedData) => {
      const config = storedData.config;
      if (config) {
        document.getElementById('max-cache-size').value = config.MAX_CACHE_SIZE;
        document.getElementById('max-hamming-distance').value = config.MAX_HAMMING_DISTANCE;
        document.getElementById('filtered-substrings').value = config.FILTERED_SUBSTRINGS.join(',');
      }
    });

    // Function to update configuration
    function updateConfig(config) {
      // Save the updated configuration to chrome.storage.local
      chrome.storage.local.set({ config }, () => {
        console.log('Configuration updated:', config);
        // Notify the user that the configuration has been saved
        alert('Configuration saved successfully.');
      });
    }

    // Add a click event listener to the "Save Configuration" button
    document.getElementById('save-config').addEventListener('click', () => {
      const maxCacheSize = parseInt(document.getElementById('max-cache-size').value, 10);
      const maxHammingDistance = parseInt(document.getElementById('max-hamming-distance').value, 10);
      const filteredSubstrings = document.getElementById('filtered-substrings').value.split(',');

      // Update configuration
      updateConfig({
        MAX_CACHE_SIZE: maxCacheSize,
        MAX_HAMMING_DISTANCE: maxHammingDistance,
        FILTERED_SUBSTRINGS: filteredSubstrings,
      });
    });
  } else {
    // Handle the case where chrome.storage.local is not available
    console.warn('chrome.storage is not available.');
  }
});