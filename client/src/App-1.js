import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import icon from "./assets/icon.png";
import "./App.css";

//core Mapbox
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

//import MapboxDirections
//https://www.npmjs.com/package/@mapbox/mapbox-gl-directions
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

//https://www.npmjs.com/package/@turf/distance
import distance from "@turf/distance";
//https://www.npmjs.com/package/@turf/buffer
import buffer from "@turf/buffer";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

// add toggle button - view filtered (by status, electric bike availability etc.)/ all stations

// TOGGLE SHOW/ HIDE layers https://docs.mapbox.com/mapbox-gl-js/example/toggle-layers/

// GENERATE BUFFER POLYGON (~5 minute walk)
// turf.buffer(point, 500, {units: 'meters'});
// CHECK WHETHER THERE ARE MARKER(S) IS WITHIN POLYGON
// https://turfjs.org/docs/#booleanPointInPolygon
// turf.booleanPointInPolygon(pt, poly);
// SORT STATIONS BY DISTANCE
// turf.distance(from, to, options);
/* const options = { units: 'meters' };
  stores.features.forEach(function(store) {
  Object.defineProperty(store.properties, 'distance', {
    value: turf.distance(searchResult, filtered.geometry, options),
    writable: true,
    enumerable: true,
    configurable: true
  });
}); 
filtered.sort(function(a, b) {
  if (a.properties.distance > b.properties.distance) {
    return 1;
  }
  if (a.properties.distance < b.properties.distance) {
    return -1;
  }
  return 0; // a must be equal to b
});
*/

const containercss = {
  width: "66.6666vw",
  height: "100vh",
  // position: "absolute"
};

export const App = () => {
  const [map, setMap] = useState(null);
  const [stations, setStations] = useState();
  const [filtered, setFiltered] = useState();
  //const [crashes, setCrashes] = useState();
  const mapContainer = useRef(null);
  const [route, setRoute] = useState([]);

  const initializeMap = ({ setMap, mapContainer }) => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/estheroids/ckcrt64ic070x1imlwhtpeh38", // stylesheet location
      center: [-75.1652, 39.9526],
      zoom: 12,
    });

    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: "metric",
      profile: "mapbox/cycling",
      countries: "us",
      bbox: [-75.375687, 39.822419, -75.011422, 40.060638],
    });

    map.addControl(directions, "top-left");

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    });

    map.addControl(geolocate);
    geolocate.on("geolocate", () => {
      console.log("geolocated.");
    });

    //console.log(stations);

    map.on("load", () => {
      setMap(map);
      map.resize();

      map.loadImage(
        // 'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
        icon,
        function (error, image) {
          if (error) throw error;
          map.addImage("custom-marker", image);

          //feed indego station geojson data here
          map.addSource("points", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: filtered,
            },
          });

          // Add a symbol layer
          map.addLayer({
            id: "indegostations",
            type: "symbol",
            source: "points",
            layout: {
              "icon-image": "custom-marker",
              "icon-allow-overlap": true,
            },
          });
        }
      );

      const flyToStation = (current) => {
        map.flyTo({
          center: current.geometry.coordinates,
          zoom: 15,
        });
        setRoute((oldArray) => [...oldArray, current]);
      };

      const createPopUp = (current) => {
        const popUps = document.getElementsByClassName("mapboxgl-popup");
        if (popUps[0]) popUps[0].remove();
        const popup = new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat(current.geometry.coordinates)
          .setHTML(
            `<h2>${current.properties.name}</h2>
            <p>
            Docks Available: ${JSON.stringify(
              current.properties.docksAvailable
            )}
            Bikes Available: ${JSON.stringify(
              current.properties.bikesAvailable
            )}
            </p>`
          )
          .addTo(map);
      };

      const listItem = document.getElementsByClassName("listItem");
      //console.log(listItem);

      map.on("click", function (e) {
        // check if a feature in the "indegostations" layer exists
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["indegostations"],
        });

        // if yes, then:
        if (features.length) {
          const clickedMarker = features[0];
          // fly to the point
          flyToStation(clickedMarker);
          // close all other popups and show popup for clicked marker on map
          createPopUp(clickedMarker);

          // DOESN'T WORK YET :(
          // GOAL: click on marker on map, scroll to corresponding listItem in the sidebar
          const activeItem = document.getElementsByClassName("active");
          if (activeItem[0]) {
            activeItem[0].classList.remove("active");
          }
          const listItem = document.getElementById(
            "listItem-" + clickedMarker.properties.id
          );
          listItem.classList.add("active");

          //figure out how to clear directions/ remove route
          /*
          // remove the layer if it exists
          const removeRoute = () => {
          if (map.getSource('route')) {
          map.removeLayer('route');
          map.removeSource('route');
          document.getElementById('').innerHTML = '';
          } else {
        return;
      }
    }*/
        }
      });
    });
  };

  useEffect(() => {
    fetch("https://kiosks.bicycletransit.workers.dev/phl/")
      .then((res) => res.json())
      .then((data) => {
        //console.log(data);
        setStations(data["features"]);
        //filter by electric bikes available
        setFiltered(
          data["features"].filter(
            (s) => s.properties.electricBikesAvailable > 0
          )
        );
        //console.log(stations);
        //initializeMap({ setMap, mapContainer });
      });
    // if (!map) initializeMap({ setMap, mapContainer });
    fetch("/api/test")
      .then((response) => response.json())
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }, []);

  /*
  try {
    let [setStations, setCrashes] = await Promise.all([
      fetch("https://kiosks.bicycletransit.workers.dev/phl/"),
      fetch("https://phl.carto.com/api/v2/sql?q=SELECT * FROM crash_data_collision_crash_2013_2017_vz WHERE bicycle_count > 0")
    ])
  }*/

  useEffect(() => {
    initializeMap({ setMap, mapContainer });
  }, [filtered]);

  return (
    <div>
      <Sidebar>
        {filtered ? (
          <div>
            {" "}
            {filtered.map((arr) => (
              //JSON.stringify(stations)
              <li
                key={arr.properties.id}
                id={`listItem-${arr.properties.id}`}
                className="listItem"
              >
                Station Name: {arr.properties.name}
                <br></br>
                Station Status: {arr.properties.kioskStatus}
                <br></br>
                Bikes Available: {arr.properties.bikesAvailable}
                <br></br>
                Docks Available: {arr.properties.docksAvailable}
                <br></br>
                Electric Bikes: {arr.properties.electricBikesAvailable}
              </li>
            ))}{" "}
          </div>
        ) : (
          "error"
        )}
      </Sidebar>
      <div className="mapWrapper">
        <div ref={(el) => (mapContainer.current = el)} style={containercss} />
      </div>
    </div>
  );
};
