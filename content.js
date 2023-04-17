// content.js
(async function () {
  'use strict';

  // Load the crypto-js library from the extension's local directory
  const cryptoJsScript = document.createElement('script');
  cryptoJsScript.src = chrome.runtime.getURL('crypto-js.min.js');

  // Log when the script has loaded successfully
  cryptoJsScript.onload = () => {
    console.log('crypto-js script loaded successfully');
    // Invoke the filterSpamPosts function to start filtering after script loads
    filterSpamPosts();
  };

  // Log and handle errors if the script fails to load
  cryptoJsScript.onerror = (error) => {
    console.error('Failed to load crypto-js script:', error);
  };

  document.head.appendChild(cryptoJsScript);

  // Load the configuration from config.json
  const config = await fetch(chrome.runtime.getURL('config.json')).then((response) => response.json());
  console.log('Loaded config:', config);

  // Set for storing filtered substrings
  const filteredSubstrings = new Set([...config.FILTERED_SUBSTRINGS]);

  // Function to filter out spam posts from the current page view
  async function filterSpamPosts() {
    // Check if the crypto-js script has been successfully loaded
    if (typeof CryptoJS === 'undefined') {
      console.error('CryptoJS library not loaded. Cannot proceed with filtering.');
      return;
    }

    const messageTables = document.querySelectorAll("table[width='700']");
    const postData = Array.from(messageTables).map(table => ({
      content: table.innerText.trim(), // Extract and trim text content
      id: table.id // Identify the table element
    }));

    // Fetch worker script, convert to Blob, and create Blob URL
    const workerScript = await fetch(chrome.runtime.getURL('filterWorker.js')).then((response) => response.text());
    const workerBlob = new Blob([workerScript], { type: 'text/javascript' });
    const workerBlobUrl = URL.createObjectURL(workerBlob);

    // Create a Web Worker for filtering using the Blob URL
    const filterWorker = new Worker(workerBlobUrl);

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

    // Log error if the worker encounters an error
    filterWorker.onerror = (error) => {
      console.error('Filter worker encountered an error:', error);
    };
  }

  // Function to allow users to update userFilteredSubstrings
  function addUserFilteredSubstring(substring) {
    filteredSubstrings.add(substring);
    console.log(`Added user-defined substring to filter: "${substring}"`);
  }

  // Test: Adding a user-defined substring to filter
addUserFilteredSubstring('test substring');
console.log('Current filtered substrings:', Array.from(filteredSubstrings));
})();