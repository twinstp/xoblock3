
self.addEventListener('message', async (event) => {
  try {
    const request = event.data;
    if (request.action === 'computeDigest') {
      const token = request.token;
      const hash = await computeSHA1(token);
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

async function testComputeSHA1() {
  const token = 'test_token';
  const expectedHash = '94ee059335e587e501cc4bf90613e0814f00a7b6';
  const computedHash = await computeSHA1(token);
  if (computedHash === expectedHash) {
    console.log('computeSHA1 test passed');
  } else {
    console.error(`computeSHA1 test failed: expected ${expectedHash}, got ${computedHash}`);
  }
}

testComputeSHA1();