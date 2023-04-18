// foreground.js
(async function () {
  'use strict';
  
  // Access the utility functions from the window object
  const { loadConfig, filterSpamPosts, addUserFilteredSubstring } = window;

  // Load the configuration and start filtering
  const config = await loadConfig();
  filterSpamPosts(config);

  // Register a listener for the "addUserFilteredSubstring" message
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
      addUserFilteredSubstring(message.substring, config);
      sendResponse({ success: true });
    }
  });

  // Invoke the filterSpamPosts function again to apply changes if the configuration is updated
  if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.config) {
        config.update(changes.config.newValue);
        filterSpamPosts(config);
      }
    });
  } else {
    console.warn('chrome.storage is not available.');
  }
})().catch((error) => {
  console.error('Error in extension:', error.message);
})();
