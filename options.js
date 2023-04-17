// options.js
document.addEventListener('DOMContentLoaded', () => {
    // Load the current configuration from chrome.storage.local and display it in the form fields
    chrome.storage.local.get('config', ({ config }) => {
      if (config) {
        document.getElementById('max-cache-size').value = config.MAX_CACHE_SIZE;
        document.getElementById('max-hamming-distance').value = config.MAX_HAMMING_DISTANCE;
        document.getElementById('filtered-substrings').value = config.FILTERED_SUBSTRINGS.join(',');
        console.log('Loaded config:', config);
      }
    });
  
    // Function to update configuration
    function updateConfig(config) {
      // Save the updated configuration to chrome.storage.local
      chrome.storage.local.set({ config }, () => {
        console.log('Configuration updated:', config);
      });
    }
  
    document.getElementById('save-config').addEventListener('click', () => {
      const maxCacheSize = parseInt(document.getElementById('max-cache-size').value);
      const maxHammingDistance = parseInt(document.getElementById('max-hamming-distance').value);
      const filteredSubstrings = document.getElementById('filtered-substrings').value.split(',');
  
      // Update configuration
      updateConfig({
        MAX_CACHE_SIZE: maxCacheSize,
        MAX_HAMMING_DISTANCE: maxHammingDistance,
        FILTERED_SUBSTRINGS: filteredSubstrings,
      });
  
      // Notify the user that the configuration has been saved
      alert('Configuration saved successfully.');
    });
  });  