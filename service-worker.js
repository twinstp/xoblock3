self.addEventListener('message', async (event) => {
  try {
    const request = event.data;
    if (request.action === 'computeDigest') {
      const token = request.token;
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
      event.source.postMessage({ hash });
      console.log('SHA-1 hash computed and sent:', hash);
    }
  } catch (error) {
    console.error('Error in service worker:', error.message);
  }
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function testComputeSHA1() {
  const token = 'test_token';
  const expectedHash = '94ee059335e587e501cc4bf90613e0814f00a7b6';
  computeSHA1(token).then(computedHash => {
    if (computedHash === expectedHash) {
      console.log('computeSHA1 test passed');
    } else {
      console.error(`computeSHA1 test failed: expected ${expectedHash}, got ${computedHash}`);
    }
  });
}

testComputeSHA1();