/**
 * Register a service worker.
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(function(reg) {
      console.log('ServiceWorker registration succeeded.');
    }).catch(function(error) {
    console.log('ServiceWorker egistration failed: ' + error);
  });
}