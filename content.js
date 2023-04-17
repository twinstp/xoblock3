(async function () {
  'use strict';

  // Load the configuration from chrome.storage.local
  chrome.storage.local.get('config', async ({ config }) => {
    if (!config) {
      console.log('No configuration found in storage.');
      return;
    }
    
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
      const cryptoJsScript = await (await fetch(chrome.runtime.getURL('crypto-js.min.js'))).text();
      const filterWorkerScript = await (await fetch(chrome.runtime.getURL('filterWorker.js'))).text();

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
        filteredSubstrings: [...filteredSubstrings] // Convert the set to an array
      });

      // Receive filtered data from the worker
      filterWorker.onmessage = (event) => {
        const { filteredIds } = event.data;
        filteredIds.forEach((id) => {
          const table = document.getElementById(id);
          // Check if the element with the given ID exists before modifying its style
          if (table) {
            table.style.visibility = 'hidden';
            table.style.display = 'none';
            console.log(`Filtered post with ID ${id}.`);
          } else {
            // Optionally, log a message if the element is not found
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
    });
    })();    
