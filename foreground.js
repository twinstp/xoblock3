(async function() {
  try {
    'use strict';

    // Log when the content script is loaded.
    console.log('Content script loaded.');

    // Attempt to load the configuration.
    const config = await loadConfig();
    if (!config) {
      console.error('Failed to load configuration.');
      return;
    }

    // Log successful loading of configuration.
    console.log('Configuration loaded:', config);

    // Apply filtering.
    filterSpamPosts(config);

    // Add a listener for the "addUserFilteredSubstring" message.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'addUserFilteredSubstring' && message.substring) {
        addUserFilteredSubstring(message.substring, config);

        // Log the addition of a user-defined substring.
        console.log(`Added user-defined substring "${message.substring}" to the filter list.`);

        sendResponse({ success: true });
      }
    });

    // Add a listener for changes in the storage.
    if (chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.config) {
          Object.assign(config, changes.config.newValue);

          // Log the update to the configuration.
          console.log('Configuration updated:', config);

          filterSpamPosts(config);
        }
      });
    } else {
      console.warn('chrome.storage is not available.');
    }
  } catch (error) {
    console.error('Error in extension:', error.message);
  }
})();