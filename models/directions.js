
// How to define coords in schema - https://github.com/Automattic/mongoose/blob/master/test/model.querying.test.js#L1931
//https://gist.github.com/aheckmann/5241574

// 2dsphere index supports queries that calculate geometries on an earth-like sphere
// The 2dsphere index supports data stored as GeoJSON objects and legacy coordinate pairs
const directions = new Schema({
    origin: {
        type: { type: String },
        coordinates: { type: [Number], index: '2dsphere' },
        name: { type: String }
    },
    destination: {
        type: { type: String },
        coordinates: { type: [Number], index: '2dsphere' },
        name: { type: String }
    }



});