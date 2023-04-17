// options.js
document.addEventListener('DOMContentLoaded', async () => {
    // Load the current configuration from config.json (locally) and display it in the form fields
    const config = await fetch('config.json').then((response) => response.json());
    if (config) {
      document.getElementById('max-cache-size').value = config.MAX_CACHE_SIZE;
      document.getElementById('max-hamming-distance').value = config.MAX_HAMMING_DISTANCE;
      document.getElementById('filtered-substrings').value = config.FILTERED_SUBSTRINGS.join(',');
    }
  });
  
  // Function to update configuration
  function updateConfig(config) {
    // Convert the configuration to a JSON string
    const configJson = JSON.stringify(config);
  
    // Save the updated configuration to config.json (locally)
    fetch('config.json', {
      method: 'PUT',
      body: configJson
    }).then(() => {
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