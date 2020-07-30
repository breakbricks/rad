import axios from "axios";

export default {
  // get user from auth0 and SAVE?
  // https://auth0.com/docs/users/search/v3/get-users-endpoint // just for getting user info
  // https://auth0.com/docs/tokens/guides/get-id-tokens // get userid!
  // https://community.auth0.com/t/getting-currently-logged-user-in-web-api/6810/6
  // You can get the ID of the user by querying the value of the NameIdentifier claim type
  // Inside one of your API controller actions
  //string userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier).Value;
  //https://community.auth0.com/t/how-to-get-user-id-and-use-to-consume-endpoint/37766
  //see Profile.js - get accessToken?
  getLoggedInUserID: function () {},

  saveCurrentUserID: function () {},

  // directions api - search coords
  // https://docs.mapbox.com/api/navigation/#directions

  //RETRIEVE DIRECTIONS
  //GET - /directions/v5/{profile}/{coordinates}
  //https://api.mapbox.com/directions/v5/mapbox/cycling/-122.42,37.78;-77.03,38.91?access_token=YOUR_MAPBOX_ACCESS_TOKEN

  // click the map to set your origin and destination. first click/ second click
  // save raw JSON response from your query
  //https://docs.mapbox.com/playground/directions/?size=n_10_n
  //&geometries=polyline6 or geojson - format of the returned geometry

  // orCoords - array? [-122.42, 37.78]
  searchRouteDir: function (orCoords, deCoords) {
    return axios.get(
      `https://api.mapbox.com/directions/v5/mapbox/cycling/${orCoords};${deCoords}?geometries=geojson&steps=true&access_token=${process.env.REACT_APP_MAPBOX_KEY}
            `
    );
  },
  // save route to database with user_id
  saveRoute: function (data) {
    return axios.post("/api/idg/", data);
  },
  // get all saved routes from database under user_id
  // display list of routes and info on sidebar, on click - display on map
  getAllRoutes: function (data) {
    return axios.post("/api/idg/getroutes/", data);
  },
  // delete route from database under user_id
  deleteRoute: function (user_id, id) {
    return axios.delete("/api/idg/" + user_id + "/" + id);
  },
};

// https://api.mapbox.com/directions/v5/mapbox/cycling/-73.996%2C40.732%3B-73.991%2C40.735?alternatives=false&geometries=geojson&steps=false&access_token=ACCESS_TOKEN
// -73.996,40.732;-73.991,40.735
// geojson response (without directions)

/*

{
  "routes": [
    {
      "geometry": {
        "coordinates": [
          [
            -73.99594,
            40.732083
          ],
          [
            -73.994786,
            40.7316
          ],
          [
            -73.992053,
            40.734751
          ],
          [
            -73.991963,
            40.734944
          ],
          [
            -73.991653,
            40.735313
          ],
          [
            -73.991002,
            40.734998
          ]
        ],
        "type": "LineString"
      },
      "legs": [
        {
          "summary": "",
          "weight": 328.8,
          "duration": 298.8,
          "steps": [],
          "distance": 670.4
        }
      ],
      "weight_name": "cyclability",
      "weight": 328.8,
      //duration in seconds?
      "duration": 298.8,
      //distance in meters
      "distance": 670.4
    }
  ],
  "waypoints": [
    // ORIGIN
    {
      "distance": 10.518907818141301,
      "name": "East 8th Street",
      "location": [
        -73.99594,
        40.732083
      ]
    },
    // DESTINATION
    {
      "distance": 0.2790648740468867,
      "name": "",
      "location": [
        -73.991002,
        40.734998
      ]
    }
  ],
  "code": "Ok",
  "uuid": "72keEEHp8XzvHAF0BPynz4WY7bd1J3Y0_4lf2wN2RKnbT8cbxIGgpQ=="
}

  */

// -73.996,40.732;-73.991,40.735
