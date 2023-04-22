document.addEventListener('DOMContentLoaded',()=>{
  if(chrome.storage){
    chrome.storage.local.get('config',(storedData)=>{
      const config=storedData.config;
      if(config){
        document.getElementById('max-cache-size').value=config.MAX_CACHE_SIZE;
        document.getElementById('max-hamming-distance').value=config.MAX_HAMMING_DISTANCE;
        document.getElementById('filtered-substrings').value=config.FILTERED_SUBSTRINGS.join(',');
      }
    });
    const updateConfig=(config)=>{
      chrome.storage.local.set({config},()=>{
        console.log('Configuration updated:',config);
        alert('Configuration saved successfully.');
      });
    };
    document.getElementById('save-config').addEventListener('click',()=>{
      const maxCacheSize=parseInt(document.getElementById('max-cache-size').value,10);
      const maxHammingDistance=parseInt(document.getElementById('max-hamming-distance').value,10);
      const filteredSubstrings=document.getElementById('filtered-substrings').value.split(',');
      updateConfig({MAX_CACHE_SIZE:maxCacheSize,MAX_HAMMING_DISTANCE:maxHammingDistance,FILTERED_SUBSTRINGS:filteredSubstrings});
    });
  }else{
    console.warn('chrome.storage is not available.');
  }
});