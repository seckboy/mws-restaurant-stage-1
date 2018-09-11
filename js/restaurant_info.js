let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2Vja2JveSIsImEiOiJjamltZ2Z5ZXAwM3ZkM3ZtaDM4dm5yMXE3In0.rvy_ZyeS_TK3JAbX9tyLLw',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = restaurant.photograph ? 'restaurant-img' : 'restaurant-no-img';
  image.srcset = `${DBHelper.imageUrlForRestaurant(restaurant).replace(/.jpg/i, '-small.jpg')} 400w, ${DBHelper.imageUrlForRestaurant(restaurant)} 800w`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant).replace(/.jpg/i, '-small.jpg');
  image.alt = restaurant.photograph_alt;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.classList.add('hours-day');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.classList.add('hours-time');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  ul.appendChild(createReviewFormHTML(self.restaurant.id));
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const liHeaderDiv = document.createElement('div');
  liHeaderDiv.classList.add('reviewHeader');

  const name = document.createElement('span');
  name.classList.add('reviewName');
  name.innerHTML = review.name;
  liHeaderDiv.appendChild(name);

  const date = document.createElement('span');
  date.classList.add('reviewDate');
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  liHeaderDiv.appendChild(date);

  li.appendChild(liHeaderDiv);

  const rating = document.createElement('div');
  rating.classList.add('rating');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('div');
  comments.classList.add('comments');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Create review form HTML and add it to the webpage.
 */
createReviewFormHTML = (id) => {
  const li = document.createElement('li');

  const liHeaderDiv = document.createElement('div');
  liHeaderDiv.classList.add('reviewHeader');

  const name = document.createElement('span');
  name.classList.add('reviewName');
  name.innerHTML = "Add Your Review";
  liHeaderDiv.appendChild(name);

  li.appendChild(liHeaderDiv);

  const ratingForm = document.createElement('form');
  ratingForm.id = "ratingForm";

  var restaurantId = document.createElement("input");
  restaurantId.setAttribute("type", "hidden");
  restaurantId.setAttribute("name", "restaurantId");
  restaurantId.setAttribute("value", id);
  ratingForm.appendChild(restaurantId);

  const rating = document.createElement('div');
  rating.classList.add('ratingForm');
  rating.innerHTML = `Rating: `;
  const ratingSelect = document.createElement('select');
  ratingSelect.name = `ratingSelect`;
  Array.from(Array(5).keys()).forEach(ratingNumber => {
    var option = document.createElement("option");
    option.text = ratingNumber + 1;
    ratingSelect.add(option);
  });
  rating.appendChild(ratingSelect);
  ratingForm.appendChild(rating);

  const commentsTextArea = document.createElement('textarea');
  commentsTextArea.classList.add('commentsTextArea');
  commentsTextArea.name = 'ratingComments';
  ratingForm.appendChild(commentsTextArea);

  const ratingsSubmit = document.createElement('input');
  ratingsSubmit.setAttribute("type", "submit");
  ratingsSubmit.classList.add('commentsSubmit');
  ratingForm.onsubmit = event => DBHelper.handleReviewsSubmit();

  ratingForm.appendChild(ratingsSubmit);

  li.appendChild(ratingForm);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
