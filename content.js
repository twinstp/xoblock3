(async function () {
  'use strict';

  // Define initial configuration
  const initialConfig = {
    MAX_CACHE_SIZE: 500,
    MAX_HAMMING_DISTANCE: 3,
    FILTERED_SUBSTRINGS: [
      //...
    ]
  };

  // Load the configuration from chrome.storage.local, or use initialConfig as a fallback
  let config;
  try {
    const storedConfig = await new Promise((resolve) => chrome.storage.local.get('config', resolve));
    config = storedConfig.config || initialConfig;
  } catch (error) {
    console.warn('Failed to load configuration from storage. Using initial configuration.');
    config = initialConfig;
  }

  // Set for storing filtered substrings
  const filteredSubstrings = new Set([...config.FILTERED_SUBSTRINGS]);

  // Function to filter out spam posts from the current page view
  async function filterSpamPosts() {
    const messageTables = document.querySelectorAll("table[width='700']");
    const postData = Array.from(messageTables).map(table => ({
      content: table.innerText.trim(),
      id: table.id
    }));

    // Create a Web Worker from the filterWorker.js file
    const filterWorker = new Worker(chrome.runtime.getURL('filterWorker.js'));

    // Send data to the worker, including postData, config, and filteredSubstrings (converted to array)
    filterWorker.postMessage({
      postData,
      config,
      filteredSubstrings: [...filteredSubstrings]
    });

    // Receive filtered data from the worker
    filterWorker.onmessage = (event) => {
      const { filteredIds } = event.data;
      filteredIds.forEach((id) => {
        const table = document.getElementById(id);
        if (table) {
          table.style.visibility = 'hidden';
          table.style.display = 'none';
          console.log(`Filtered post with ID ${id}.`);
        } else {
          console.warn(`Element with ID ${id} not found.`);
        }
      });
    };
  }

  // Invoke the filterSpamPosts function to start filtering
  await filterSpamPosts();

  // Function to allow users to update userFilteredSubstrings
  function addUserFilteredSubstring(substring) {
    filteredSubstrings.add(substring);
    // Update the configuration in storage
    config.FILTERED_SUBSTRINGS = [...filteredSubstrings];
    chrome.storage.local.set({ config }, () => {
      console.log(`Added user-defined substring "${substring}" to the filter list.`);
    });
  }

  // Register a listener for the "addUserFilteredSubstring" message
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
      addUserFilteredSubstring(message.substring);
      sendResponse({ success: true });
    }
    return false; // Indicate that the listener will not respond asynchronously
  });

  // Invoke the filterSpamPosts function again to apply changes if the configuration is updated
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.config) {
      // Update the local configuration and filtered substrings
      config = changes.config.newValue;
      filteredSubstrings.clear();
      config.FILTERED_SUBSTRINGS.forEach((substring) => filteredSubstrings.add(substring));
      // Re-run the filter
      filterSpamPosts();
    }
  });

})().catch((error) => {
  console.error('Error in extension:', error.message);
});