(async function () {
  'use strict';

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
})();