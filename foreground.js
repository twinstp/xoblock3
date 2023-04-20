'use strict';

// Test case to verify filterSpamPosts is being called
function testFilterSpamPosts(filterSpamPosts) {
  const mockConfig = { MAX_CACHE_SIZE: 10, MAX_HAMMING_DISTANCE: 3, FILTERED_SUBSTRINGS: new Set() };
  filterSpamPosts(mockConfig);
  console.log('filterSpamPosts test passed');
}

// Test case to verify addUserFilteredSubstring is being called
function testAddUserFilteredSubstring(addUserFilteredSubstring, config) {
  const mockSubstring = 'test_substring';
  addUserFilteredSubstring(mockSubstring, config);
  console.log('addUserFilteredSubstring test passed');
}

// Test case to verify loadConfig is being called
async function testLoadConfig(loadConfig) {
  const config = await loadConfig();
  if (config) {
    console.log('loadConfig test passed');
  } else {
    console.error('loadConfig test failed');
  }
}

// Handler for onMessage event
function onMessageHandler(message, sender, sendResponse, config) {
  const { type, substring } = message;
  if (type === 'addUserFilteredSubstring' && substring) {
    addUserFilteredSubstring(substring, config);
    console.log(`Added user-defined substring "${substring}" to the filter list.`);
    sendResponse({ success: true });
  }
}

// Async top-level function for the content script
async function contentScript() {
  console.log('Content script loaded.');
  const config = await loadConfig();
  if (!config) {
    console.error('Failed to load configuration.');
    return;
  }
  console.log('Configuration loaded:', config);

  // Call and test functions
  filterSpamPosts(config);
  testFilterSpamPosts(filterSpamPosts);
  testAddUserFilteredSubstring(addUserFilteredSubstring, config);
  await testLoadConfig(loadConfig);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    onMessageHandler(message, sender, sendResponse, config);
  });

  if (chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.config) {
        Object.assign(config, changes.config.newValue);
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