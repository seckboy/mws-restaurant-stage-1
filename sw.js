self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('restaurant-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'restaurant.html?id=1',
        'restaurant.html?id=2',
        'restaurant.html?id=3',
        'restaurant.html?id=4',
        'restaurant.html?id=5',
        'restaurant.html?id=6',
        'restaurant.html?id=7',
        'restaurant.html?id=8',
        'restaurant.html?id=9',
        'restaurant.html?id=10',
        'data/restaurants.json',
        'css/styles.css',
        'js/dbhelper.js',
        'js/idb.js',
        'js/main.js',
        'js/restaurant_info.js',
        'img/1.jpg',
        'img/1-small.jpg',
        'img/2.jpg',
        'img/2-small.jpg',
        'img/3.jpg',
        'img/3-small.jpg',
        'img/4.jpg',
        'img/4-small.jpg',
        'img/5.jpg',
        'img/5-small.jpg',
        'img/6.jpg',
        'img/6-small.jpg',
        'img/7.jpg',
        'img/7-small.jpg',
        'img/8.jpg',
        'img/8-small.jpg',
        'img/9.jpg',
        'img/9-small.jpg',
        'img/10.jpg',
        'img/10-small.jpg'

      ]);
    })
  );
});


self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(requestUrl.pathname).then(response => {
      return response || fetch(event.request);
    })
  );

});



