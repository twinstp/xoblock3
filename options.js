// options.js
document.getElementById('save-config').
addEventListener('click', () => {
    const maxCacheSize = parseInt(document.getElementById('max-cache-size').value);
    const maxHammingDistance = parseInt(document.getElementById('max-hamming-distance').value);
    const filteredSubstrings = document.getElementById('filtered-substrings').value.split(',');
  
    // Update configuration
    updateConfig({
      MAX_CACHE_SIZE: maxCacheSize,
      MAX_HAMMING_DISTANCE: maxHammingDistance,
      FILTERED_SUBSTRINGS: filteredSubstrings
    });
  
    // Notify the user that the configuration has been saved
    alert('Configuration saved successfully.');
  });  