/**
 * Common database helper functions.
 */
class DBHelper {

  static getIDBRestaurantsPromise(){
    const dbPromise = idb.open('restaurants-v1', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaurants');
    });
    return dbPromise;
  }

  static getIDBQueuePromise() {
    const dbQueuePromise = idb.open('apiQueue', 1, upgradeDB => {
      upgradeDB.createObjectStore('apiQueue', {
        autoIncrement: true,
        keyPath: "id"
      });
    });
    return dbQueuePromise;
  }

  static get DATABASE_HOST() {
    return `http://localhost:1337`;
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `${DBHelper.DATABASE_HOST}/restaurants`;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_REVIEWS_URL() {
    return `${DBHelper.DATABASE_HOST}/reviews`;
  }


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get REVIEWS_URL() {
    return `http://localhost:1337/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    const dbPromise = this.getIDBRestaurantsPromise();

    /* First try to render with data from IndexedDB so site works offline and renders quickly if slow connection */
    dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readonly');
      DBHelper.renderRestaurantsFromIDB(tx,callback);
      tx.complete;
    });

    let reviewsFromUrl = null;
    let restaurantsFromUrl = null;
    let idIndexMap = new Map();
    fetch(DBHelper.REVIEWS_URL)
      .then(response => {
        return response.json();
      })
      .then(reviews => {
        reviewsFromUrl = reviews;

        fetch(DBHelper.DATABASE_URL)
          .then(response => {
            return response.json();
          })
          .then(restaurants => {
            restaurantsFromUrl = restaurants;

            restaurantsFromUrl.forEach((element,index) => {
              restaurantsFromUrl[index].reviews=[];
              restaurantsFromUrl[index].index=index;
              idIndexMap.set(restaurantsFromUrl[index].id,index);
            });

            reviewsFromUrl.forEach((review) =>{
              console.log(`index ${idIndexMap.get(review.restaurant_id)} id ${review.restaurant_id}`);
              restaurantsFromUrl[idIndexMap.get(review.restaurant_id)].reviews.push(review);
            });

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

  static addToIDBQueue(properties){

    const dbQueuePromise = this.getIDBQueuePromise();

    dbQueuePromise.then(db => {
      const tx2 = db.transaction('apiQueue', 'readwrite');
      tx2.objectStore('apiQueue').put({url: properties.url, method: properties.method, body: properties.body})
        .then(success => {
          console.log("successfully set idb with data from api server");
        });
      tx2.complete;
    }).then(() => {
      DBHelper.processIDBQueue();
    });

  }

  static processIDBQueue(){

    console.log("processing idb queue");

    const dbQueuePromise = this.getIDBQueuePromise();

    dbQueuePromise.then(db => {
      const tx = db.transaction('apiQueue', 'readwrite');
      tx.objectStore('apiQueue').openCursor()
        .then(cursor => {
          if(cursor) {
            fetch(cursor.value.url,{method: cursor.value.method, body: cursor.value.body})
              .then(response => {
                return response.ok;
              })
              .then(deleteCursor => {
                if(deleteCursor) {
                  const tx2 = db.transaction('apiQueue', 'readwrite');
                  tx2.objectStore('apiQueue').openCursor()
                    .then(cursor => {
                      cursor.delete().then(this.processIDBQueue());
                    });
                }
              });
          }
        });
    });
  }

  static updateIDBFavorite(id,isFavorite){
    const dbPromise = this.getIDBRestaurantsPromise();
    dbPromise.then(db => {

      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').get('restaurants')
        .then(restaurantsFromIDB => {
          restaurantsFromIDB.forEach(function(element,index) {
            if(element.id == id) {
              restaurantsFromIDB[index].is_favorite = isFavorite;
            }
          });
          const tx2 = db.transaction('restaurants', 'readwrite');
          tx2.objectStore('restaurants').put(restaurantsFromIDB,'restaurants');
          tx2.complete;
        })
        .catch(error => {
          console.log(error);
        });

    });
    }

  static handleFavoriteClick(elementId) {
    const id = elementId.replace(/favorite\-/,'');
    const isFavorite = document.getElementById(elementId).checked;
    const url = `http://localhost:1337/restaurants/${id}/?is_favorite=${isFavorite}`;
    const properties = {url: url, method: "PUT"};
    this.addToIDBQueue(properties);
    // this.processIDBQueue();
    this.updateIDBFavorite(id,isFavorite);
  }

  static handleReviewsSubmit(){
    const form = document.getElementById('ratingForm');

    const id = form.id.value;
    const url = DBHelper.DATABASE_REVIEWS_URL;
    const createdAt = Date.now();
    const body = {
      restaurant_id: id,
      name: form.ratingName.value,
      rating: form.ratingSelect.value,
      comments: form.ratingComments.value,
      createdAt: createdAt,
      updatedAt: createdAt

    }
    const properties = {url: url, method: "POST", body: JSON.stringify(body)};
    this.addToIDBQueue(properties);

    return false;
  }
}

