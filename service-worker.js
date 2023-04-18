// service-worker.js
importScripts('service-worker-utils.js');

self.addEventListener('message', async (event) => {
  const request = event.data;
  if (request.action === 'computeDigest') {
    const encoder = new TextEncoder();
    const encodedToken = encoder.encode(request.token);
    const hashBuffer = await crypto.subtle.digest('SHA-1', encodedToken);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    event.source.postMessage({hash: hashHex});
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
