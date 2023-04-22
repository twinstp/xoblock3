'use strict';

async function loadConfiguration() {
  const configData = await loadConfig();
  if (!configData) {
    console.error('Failed to load configuration.');
    return null;
  }
  console.log('Configuration loaded:', configData.config);
  return configData;
}

function registerListeners(configData) {
  // Listener for adding user-defined filtered substrings
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, substring } = message;
    if (type === 'addUserFilteredSubstring' && substring) {
      addUserFilteredSubstring(substring, configData.config);
      console.log(`Added user-defined substring "${substring}" to the filter list.`);
      sendResponse({ success: true });
    }
  });

  // Listener for configuration changes
  if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.config) {
        const newConfig = changes.config.newValue;
        Object.assign(configData.config, newConfig);
        console.log('Configuration updated:', configData.config);
        filterSpamPosts(configData.config, configData.substringTrie);
      }
    });
  } else {
    console.warn('chrome.storage is not available.');
  }
}

async function contentScript() {
  console.log('Content script loaded.');
  const configData = await loadConfiguration();
  if (!configData) {
    return;
  }
  await filterSpamPosts(configData.config, configData.substringTrie);
  registerListeners(configData);
}

contentScript().catch((error) => {
  console.error('Error in extension:', error.message);
});