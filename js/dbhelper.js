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

  static getIDBReviewsPromise(){
    const dbPromise = idb.open('reviews', 1, upgradeDB => {
      upgradeDB.createObjectStore('reviews');
    });
    return dbPromise;
  }

  static  getIDBQueuePromise() {
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
              DBHelper.renderRestaurantsFromIDB(tx2,callback);
            });
          tx2.complete;
        });
      });
  }

  /**
   * Retrieve restaurants from IDB
   */

  static renderRestaurantsFromIDB(transaction,callback){
    transaction.objectStore('restaurants').get('restaurants')
      .then(restaurantsFromIDB => {
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
        let results = restaurants;
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

  static async tryQueue(){
    let resultsOfProcessingQueue  = await DBHelper.getResultsOfProcessingQueue();
    let deletePromises = [];
    resultsOfProcessingQueue.forEach(([result]) => {
      const mypromise = DBHelper.getDeleteQueueItemPromise(result);
      deletePromises.push(mypromise);
    });
    await DBHelper.deleteProcessedQueueItems(deletePromises);
  }

  static async getResultsOfProcessingQueue(){
    let promise1 = this.getIDBQueuePromise()
      .then(async db => {
        return await DBHelper.processQueue(db);
      });
    let [promiseArray] = await Promise.all([promise1]);
    return promiseArray;
  }

  static async processQueue(db){
    let promiseArray = [];
    const tx = db.transaction('apiQueue', 'readwrite');
    tx.objectStore('apiQueue').iterateCursor(async cursor => {
      if (!cursor) return;
      let promise1 = DBHelper.awaitfetch(cursor.value.url,cursor.primaryKey,cursor.value.method,cursor.value.body);
      promiseArray.push(promise1);
      cursor.continue();
    });
    return tx.complete.then(() => {
      return Promise.all(promiseArray);
    });
  }

  static async awaitfetch(url,id,method,body){
    let mypromise = fetch(url,{method: method, body: body})
      .then(response => {
        return { id: id, status: response.ok, body: body};
      })
      .catch(error => {
        console.log(error);
        return {status: false, body: body};
      });
    return await Promise.all([mypromise]);
  }

  static async getDeleteQueueItemPromise(queueResult){
    let myresult = DBHelper.getIDBQueuePromise()
      .then(db => {
        const tx = db.transaction('apiQueue', 'readonly');
        return tx.objectStore('apiQueue').get(queueResult.id)
          .then(() => {
            if(queueResult.status) {
              const txdel = db.transaction('apiQueue', 'readwrite');
              txdel.objectStore('apiQueue').delete(queueResult.id);
              txdel.complete;
              return true;
            }
            return false;
          });
        tx.complete;
      });
    return myresult;
  }

  static async deleteProcessedQueueItems(deletePromiseArray){
    Promise.all(deletePromiseArray)
      .catch(error => {
        console.log(error);
      });
  }

  static async getReviewsFromServer(id){

    let mypromise = fetch(`${DBHelper.DATABASE_REVIEWS_URL}?restaurant_id=${id}`,{method: "GET"})
      .then(response => {
        return response.json();
      })
      .then(lreviews => {
        return lreviews;
      })
      .catch(() => {
        return false;
      });

    let awaitResult = Promise.all([mypromise]);
    let [[finalResult]] = await Promise.all([awaitResult]);
    return finalResult;
  }

  static async updateIDBReviews(reviews,id){
    const dbPromise = this.getIDBReviewsPromise();
    let promise = dbPromise.then(db => {
      const tx2 = db.transaction('reviews', 'readwrite');
      tx2.objectStore('reviews').put(reviews,id)
        .then(() => {
          console.log("successfully updated idb with server reviews");
        });
      tx2.complete;
    });
    await Promise.all([promise]);

  }

  static async getIDBReviews(id){
    const dbPromise = this.getIDBReviewsPromise();
    let promise = dbPromise.then(db => {
      const tx2 = db.transaction('reviews', 'readonly');
      let result = tx2.objectStore('reviews').get(parseInt(id))
        .then(reviews => {
          return reviews;
        })
        .catch(error => {
          console.log(error);
          return false;
        });
      tx2.complete;
      return result;
    });

    let [finalResult] = await Promise.all([promise]);
    return finalResult;
  }

  static async handleReviewsSubmit(){
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

    const properties = {url: url, method: "POST", body: JSON.stringify(body), type: "addReview"};
    await this.addReviewToIDB(id,properties);
    DBHelper.addToIDBQueue(properties);
  }

  static async addReviewToIDB(id,properties){
    let idbreviews = await DBHelper.getIDBReviews(id);
    if(idbreviews) {
      idbreviews.push(JSON.parse(properties.body));
    }

    const dbPromise = this.getIDBReviewsPromise();
    let nextpromise = dbPromise.then(db => {
      const tx2 = db.transaction('reviews', 'readwrite');
      tx2.objectStore('reviews').put(idbreviews,parseInt(id))
        .then(success => {
          console.log("successfully set idb with submitted review");
        })
        .catch(error => {
          console.log(error);
        });
      ;
      tx2.complete;
    });

    await Promise.all([nextpromise]);
  }

  static async addToIDBQueue(properties){

    const dbQueuePromise = this.getIDBQueuePromise();

    let mypromise = dbQueuePromise.then(db => {
      const tx2 = db.transaction('apiQueue', 'readwrite');
      return tx2.objectStore('apiQueue').put({url: properties.url, method: properties.method, body: properties.body, type: properties.type})
        .then(() => {
          console.log("successfully set idb with data from api server");
          return true;
        });
      tx2.complete;
    })
      .catch(error => {
        console.log(error);
        return false;
      });

    let [addToQueueResult] = await Promise.all([mypromise]);
    if(addToQueueResult) DBHelper.tryQueue();
  }

  static async handleFavoriteClick(elementId) {
    const id = elementId.replace(/favorite\-/,'');
    const isFavorite = document.getElementById(elementId).checked;
    const url = `http://localhost:1337/restaurants/${id}/?is_favorite=${isFavorite}`;
    const properties = {url: url, method: "PUT", type: "favorite"};
    await DBHelper.updateIDBFavorite(id,isFavorite);
    DBHelper.addToIDBQueue(properties);
  }

  static updateIDBFavorite(id,isFavorite){
    const dbPromise = DBHelper.getIDBRestaurantsPromise();
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






}

