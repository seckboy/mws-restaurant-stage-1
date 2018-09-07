/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:1337/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    const dbPromise = idb.open('restaurants-v1', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaurants');
    });

    /* First try to render with data from IndexedDB so site works offline and renders quickly if slow connection */
    dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readonly');
      DBHelper.renderRestaurantsFromIDB(tx,callback);
      tx.complete;
    });

    /*
    Fetch data from api server, put in IndexedDB, call callback so that it renders
    if there was no data yet in IndexedDB and so the page contains up-to-date data.
    */
    let restaurantsFromUrl = null;
    fetch(DBHelper.DATABASE_URL)
      .then(response => {
        return response.json();
      })
      .then(restaurants => {
        restaurantsFromUrl = restaurants;

        dbPromise.then(db => {

          /* Put the restaurants in IDB if the api server returns results */
          const tx2 = db.transaction('restaurants', 'readwrite');
          tx2.objectStore('restaurants').put(restaurantsFromUrl,'restaurants')
            .then(success => {
              console.log("successfully set idb with data from api server");
              DBHelper.renderRestaurantsFromIDB(tx2,callback);
            });
          tx2.complete;
        });
      })
      .catch( error => {
        callback(error, null);
      });
  }

  /**
   * Retrieve restaurants from IDB
   */

  static renderRestaurantsFromIDB(transaction,callback){
    transaction.objectStore('restaurants').get('restaurants')
      .then(restaurantsFromIDB => {
        console.log("successfully received data from IndexedDB");
        callback(null, restaurantsFromIDB);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static updateFavorite(properties) {
    fetch(properties.url,{method: properties.method});
  }

  static addToIDBQueue(properties){
    const dbPromise = idb.open('apiQueue', 1, upgradeDB => {
      upgradeDB.createObjectStore('apiQueue', {
        autoIncrement : true,
        keyPath: "id"
      });
    });

    dbPromise.then(db => {

      /* Put the restaurants in IDB if the api server returns results */
      const tx2 = db.transaction('apiQueue', 'readwrite');
      tx2.objectStore('apiQueue').put({url: properties.url, method: properties.method})
        .then(success => {
          console.log("successfully set idb with data from api server");
        });
      tx2.complete;
    });


  }

  static handleFavoriteClick(elementId) {
    const id = elementId.replace(/favorite\-/,'');
    const isFavorite = document.getElementById(elementId).checked;
    const url = `http://localhost:1337/restaurants/${id}/?is_favorite=${isFavorite}`;
    const properties = {url: url, method: "PUT"};
    this.addToIDBQueue(properties);
    this.updateFavorite(properties);
  }
}

