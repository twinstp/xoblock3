// content.js
(async function () {
  'use strict';

  // Load the crypto-js library from the extension's local directory using a relative path
  const cryptoJsScript = document.createElement('script');
  cryptoJsScript.src = 'crypto-js.min.js';

  // Add an onload event handler to ensure the script is loaded before filtering starts
  cryptoJsScript.onload = async () => {
    console.log('crypto-js script loaded successfully');

    // Load the configuration from config.json
    const config = await fetch('config.json').then((response) => response.json());
    console.log('Loaded config:', config);

    // Set for storing filtered substrings
    const filteredSubstrings = new Set([...config.FILTERED_SUBSTRINGS]);

    // Function to filter out spam posts from the current page view
    async function filterSpamPosts() {
      const messageTables = document.querySelectorAll("table[width='700']");
      const postData = Array.from(messageTables).map(table => ({
        content: table.innerText.trim(), // Extract and trim text content
        id: table.id // Identify the table element
      }));

      // Create a Web Worker for filtering using a relative path
      const filterWorker = new Worker('filterWorker.js');

      // Send data to the worker, including postData and filteredSubstrings
      filterWorker.postMessage({ postData, config, filteredSubstrings });

      // Receive filtered data from the worker
      filterWorker.onmessage = (event) => {
        const { filteredIds } = event.data;
        filteredIds.forEach((id) => {
          const table = document.getElementById(id);
          table.style.visibility = 'hidden';
          table.style.display = 'none';
        });
      };
    }

    // Invoke the filterSpamPosts function to start filtering
    await filterSpamPosts();

    // Function to allow users to update userFilteredSubstrings
    function addUserFilteredSubstring(substring) {
      filteredSubstrings.add(substring);
    }
  };

  // Add an onerror event handler to handle errors while loading the script
  cryptoJsScript.onerror = () => {
    console.error('Failed to load crypto-js script');
  };

  // Append the script element to the document head
  document.head.appendChild(cryptoJsScript);
})();
