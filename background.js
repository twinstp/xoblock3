// background.js
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const urlsToMatch = [
      "https://www.xoxohth.com/*",
      "https://xoxohth.com/*",
      "http://xoxohth.com/*",
      "http://www.xoxohth.com/*",
      "https://*.xoxohth.com/*",
      "http://*.xoxohth.com/*",
      "https://www.autoadmit.com/*",
      "https://autoadmit.com/*",
      "http://autoadmit.com/*",
      "http://www.autoadmit.com/*"
    ];
  
    if (urlsToMatch.some(urlPattern => tab.url.startsWith(urlPattern))) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["service-worker-utils.js", "utils.js", "foreground.js"]
      });
    }
  });  