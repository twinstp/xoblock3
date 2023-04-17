(async function () {
  'use strict';

  async function fetchAndParseJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.json();
  }

  async function fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
  }

  try {
    // Load the configuration from config.json (locally)
    const config = await fetchAndParseJSON(chrome.runtime.getURL('config.json'));
    console.log('Loaded config:', config);

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
      const cryptoJsScript = await fetchText(chrome.runtime.getURL('crypto-js.min.js'));
      const filterWorkerScript = await fetchText(chrome.runtime.getURL('filterWorker.js'));

      // Combine the two scripts into one
      const combinedScript = `${cryptoJsScript}\n${filterWorkerScript}`;

      // Create a Blob URL for the combined script
      const blob = new Blob([combinedScript], { type: 'text/javascript' });
      const blobURL = URL.createObjectURL(blob);

      // Create a Web Worker using the Blob URL
      const filterWorker = new Worker(blobURL);

      // Send data to the worker, including postData and filteredSubstrings (converted to array)
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
  } catch (error) {
    console.error('Error in extension:', error.message);
  }
})();
