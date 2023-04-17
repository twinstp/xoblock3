// background.js
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'computeDigest') {
    const encoder = new TextEncoder();
    const encodedToken = encoder.encode(request.token);
    const hashBuffer = await crypto.subtle.digest('SHA-1', encodedToken);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    sendResponse({hash: hashHex});
  }
  return true; // Indicate that the response is asynchronous
});