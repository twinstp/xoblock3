// content.js
(async function () {
  'use strict';

  // Load the crypto-js library from the extension's local directory
  const cryptoJsScript = document.createElement('script');
  cryptoJsScript.src = chrome.runtime.getURL('crypto-js.min.js');
  document.head.appendChild(cryptoJsScript);

  // Load the configuration from config.json
  const config = await fetch(chrome.runtime.getURL('config.json')).then((response) => response.json());
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

    // Create a Web Worker for filtering
    const filterWorker = new Worker('filterWorker.js');

    // Get the URL for crypto-js.min.js
    const cryptoJsUrl = chrome.runtime.getURL('crypto-js.min.js');

    // Send data to the worker, including postData, filteredSubstrings, and cryptoJsUrl
    filterWorker.postMessage({ postData, config, filteredSubstrings, cryptoJsUrl });

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
})();