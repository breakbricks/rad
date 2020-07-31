// How to define coords in schema - https://github.com/Automattic/mongoose/blob/master/test/model.querying.test.js#L1931
//https://gist.github.com/aheckmann/5241574

// 2dsphere index supports queries that calculate geometries on an earth-like sphere
// The 2dsphere index supports data stored as GeoJSON objects and legacy coordinate pairs

/* ========= POINT EXAMPLE ============// 
db.places.insert(
    {
        loc : { 
            type: "Point", 
            coordinates: [ -73.97, 40.77 ] 
        },
        name: "Central Park",
        category : "Parks"
     }
  )
*/

/* ======== LINE EXAMPLE ========= //

geoSchema = new Schema({ 
    line: { 
        type: { type: String }, 
        coordinates: [] 
    } 
});

geoSchema.index({ line: '2dsphere' });


const geojsonLine = { 
    type: 'LineString', 
    coordinates: [[180.0, 11.0], 
    [180.0, '9.00']] 
};

*/

//do you have to use loc?
//https://auth0.com/docs/users/normalized/auth0/identify-users
// https://auth0.com/docs/tokens/guides/get-id-tokens

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const idgrouteSchema = new Schema({
  //auth0 identify users with: user_id
  //"user_id": "usr_5457edea1b8f33391a000004",
  //{identity provider id}|{unique id in the provider}
  date: {
    type: Date,
    default: Date.now,
  },
  user_id: { type: String },
  ostation_id: { type: Number },
  ostation_name: { type: String },
  ostation_address: { type: String },
  origin: { type: [Number] },
  dstation_id: { type: Number },
  dstation_name: { type: String },
  dstation_address: { type: String },
  destination: { type: [Number] },
  /*
  //obj.routes[0].geometry.coordinates[0] ?
  origin: {
    type: { type: String },
    coordinates: { type: [Number], index: "2dsphere" },
    name: { type: String },
  },
  //obj.routes[0].geometry.coordinates[last in the array] ?
  
  destination: {
    type: { type: String },
    coordinates: { type: [Number], index: "2dsphere" },
    name: { type: String },
  },
  //obj.routes[0].geometry.legs.duration
  // duration in seconds

  //obj.routes[0].geometry.legs.distance
  // distance in meters
  */
});

const IDGRoute = mongoose.model("IDGRoute", idgrouteSchema);

module.exports = IDGRoute;
