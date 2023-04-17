(async function () {
  'use strict';

  // Define initial configuration
  const initialConfig = {
    MAX_CACHE_SIZE: 500,
    MAX_HAMMING_DISTANCE: 3,
    FILTERED_SUBSTRINGS: [
      "modification, and he recently agreed to answer our questions",
      "legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago",
      "America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling",
      "Go to the link, and look at that woman. Look at that face. She never expressed any remorse over",
      "destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess."
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

    // Load crypto-js.min.js and filterWorker.js as strings (locally)
    const cryptoJsScript = await (await fetch(chrome.runtime.getURL('crypto-js.min.js'))).text();
    const filterWorkerScript = await (await fetch(chrome.runtime.getURL('filterWorker.js'))).text();

    // Combine the two scripts into one
    const combinedScript = `${cryptoJsScript}\n${filterWorkerScript}`;

    // Create a Blob URL for the combined script
    const blob = new Blob([combinedScript], { type: 'text/javascript' });
    const blobURL = URL.createObjectURL(blob);

    // Create a Web Worker using the Blob URL
    const filterWorker = new Worker(blobURL);

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
    // This allows the background or options page to request the addition of a new substring to the filter
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'addUserFilteredSubstring' && message.substring) {
    addUserFilteredSubstring(message.substring);
    sendResponse({ success: true });
    }
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