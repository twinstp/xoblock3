'use strict';
async function contentScript() {
  console.log('Content script loaded.');
  const config = await loadConfig();
  if (!config) {
    console.error('Failed to load configuration.');
    return;
  }
  console.log('Configuration loaded:', config);
  await filterSpamPosts(config);
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, substring } = message;
    if (type === 'addUserFilteredSubstring' && substring) {
      addUserFilteredSubstring(substring, config);
      console.log(`Added user-defined substring "${substring}" to the filter list.`);
      sendResponse({ success: true });
    }
  });
  if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.config) {
        const newConfig = changes.config.newValue;
        Object.assign(config, newConfig);
        console.log('Configuration updated:', config);
        filterSpamPosts(config);
      }
    });
  } else {
    console.warn('chrome.storage is not available.');
  }
}

contentScript().catch((error) => {
  console.error('Error in extension:', error.message);
});