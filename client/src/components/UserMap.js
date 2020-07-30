import React, { useState, useEffect, useRef } from "react";

import icon from "../assets/icon.png";
import "../App.css";
import { Sidebar } from "./Sidebar";
import { Profile } from "./Profile";

import API from "../utils/API";

//core Mapbox
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAuth0 } from "@auth0/auth0-react";

//import MapboxDirections
//https://www.npmjs.com/package/@mapbox/mapbox-gl-directions
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions";
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const styles = {
  width: "66.6666vw",
  height: "100vh",
  // position: "absolute"
};

export const UserMap = () => {
  const { user } = useAuth0();

  const [map, setMap] = useState(null);
  const [filtered, setFiltered] = useState();
  //const [crashes, setCrashes] = useState();
  const mapContainer = useRef(null);
  const [route, setRoute] = useState([]);

  const initializeMap = ({ setMap, mapContainer }) => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/estheroids/ckcrt6ss80i1t1inpoxsfpjdm", // stylesheet location
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
        }
      });
    });
  };

  const submit = () => {
    try {
      API.saveRoute({
        user_id: user.email,
        origin: route[0].geometry.coordinates,
        destination: route[1].geometry.coordinates,
      }).then((res) => {
        alert(JSON.stringify(res));
      });
    } catch (err) {
      alert(err);
    }
  };

  useEffect(() => {
    fetch("https://kiosks.bicycletransit.workers.dev/phl/")
      .then((res) => res.json())
      .then((data) => {
        //console.log(data);
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

  useEffect(() => {
    initializeMap({ setMap, mapContainer });
  }, [filtered]);

  return (
    <div>
      <div ref={(el) => (mapContainer.current = el)} style={styles} />
      <button onClick={() => submit()}>Save</button>
    </div>
  );
};
