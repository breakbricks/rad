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
  //route to save
  const [route, setRoute] = useState([]);
  //existing/saved routes
  const [exroutes, setExRoutes] = useState([]);

  //https://github.com/mapbox/mapbox-gl-directions/blob/master/src/directions_style.js
  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    styles: [
      {
        //alternate route line
        id: "directions-route-line-alt",
        type: "line",
        source: "directions",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#df3a1a",
          "line-width": 5,
          "line-opacity": 0.75,
        },
        filter: [
          "all",
          ["in", "$type", "LineString"],
          ["in", "route", "alternate"],
        ],
      },
      {
        id: "directions-route-line-casing",
        type: "line",
        source: "directions",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#c1c4cd",
          "line-width": 12,
        },
        filter: [
          "all",
          ["in", "$type", "LineString"],
          ["in", "route", "selected"],
        ],
      },
      {
        id: "directions-route-line",
        type: "line",
        source: "directions",
        layout: {
          "line-join": "round",
          "line-cap": "butt",
        },
        paint: {
          "line-color": "#df810b",
          "line-width": 7,
        },
        filter: [
          "all",
          ["in", "$type", "LineString"],
          ["in", "route", "selected"],
        ],
      },
    ],
    unit: "metric",
    profile: "mapbox/cycling",
    countries: "us",
    //limit geocoder with philadelphia bbox
    geocoder: {
      bbox: [-75.345858, 39.851572, -74.956187, 40.063682],
    },
    controls: {
      inputs: true,
      instructions: true,
      profileSwitcher: true,
    },
    placeholderOrigin: "Origin",
    placeholderDestination: "Destination",
    alternatives: true,
  });

  const initializeMap = ({ setMap, mapContainer }) => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      //style: "mapbox://styles/estheroids/ckcrt6ss80i1t1inpoxsfpjdm", // stylesheet location
      style: "mapbox://styles/mapbox/light-v10",
      center: [-75.1652, 39.9526],
      zoom: 12,
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

  /*
  //https://github.com/mapbox/mapbox-gl-directions/blob/master/API.md
  //To remove the route from the map, use removeRoute().
  //removeRoute() - Remove the route line from the map style.
  // remove the layer if it exists

  const removeRoute = () => {
    if (map.getSource("route")) {
      map.removeLayer("route");
      map.removeSource("route");
      document.getElementById("calculated-line").innerHTML = "";
    } else {
      return;
    }
  }; */

  //toggle indegostations markers layer
  const toggleLayerM = () => {
    const visibility = map.getLayoutProperty("indegostations", "visibility");
    if (visibility === "visible") {
      map.setLayoutProperty("indegostations", "visibility", "none");
    } else {
      map.setLayoutProperty("indegostations", "visibility", "visible");
    }
  };
  //toggle stations displayroute layer
  const toggleLayerR = () => {
    const visibility = map.getLayoutProperty("displayroute", "visibility");
    if (visibility === "visible") {
      map.setLayoutProperty("displayroute", "visibility", "none");
    } else {
      map.setLayoutProperty("displayroute", "visibility", "visible");
    }
  };

  const removeRoute = () => {
    //removeRoutes()
    //https://github.com/mapbox/mapbox-gl-directions/blob/master/API.md

    directions.removeRoutes();
    //map.removeControl(directions);

    // GET ALL THE LAYERS - find out which layer is the route
    console.log(map.getStyle().layers);
    //const layers = map.getStyle().layers;

    //REMOVE layers associated with route
    /*layers.map((layer) =>
      layer.source === "directions" ? map.removeLayer(layer.id) : ""
    );*/
  };
  const submit = () => {
    console.log(route);
    try {
      API.saveRoute({
        user_id: user.email,
        ostation_id: route[0].properties.id,
        ostation_name: route[0].properties.name,
        ostation_address: route[0].properties.addressStreet,
        origin: route[0].geometry.coordinates,
        //make last in the array the destination?
        dstation_id: route[route.length - 1].properties.id,
        dstation_name: route[route.length - 1].properties.name,
        dstation_address: route[route.length - 1].properties.addressStreet,
        destination: route[route.length - 1].geometry.coordinates,
      }).then((res) => {
        alert(JSON.stringify(res));
        API.getAllRoutes({
          user_id: user.email,
        }).then((res) => {
          console.log(res.data);
          setExRoutes(res.data);
        });
      });
    } catch (err) {
      alert(err);
    }
  };

  const delRoute = (id) => {
    API.deleteRoute(id)
      .then((res) => {
        console.log(res.data);
        console.log("deleted");
        API.getAllRoutes({
          user_id: user.email,
        }).then((res) => {
          console.log(res.data);
          //set existing routes [] to res.data
          setExRoutes(res.data);
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    //get all routes in database with user_id: of user.email
    //see utils/API.js and idgcontroller.js
    API.getAllRoutes({
      user_id: user.email,
    }).then((res) => {
      console.log(res.data);
      //set existing routes [] to res.data
      setExRoutes(res.data);
    });
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
    /*fetch("/api/test")
      .then((response) => response.json())
      .then((res) => console.log(res))
      .catch((err) => console.log(err));*/
  }, []);

  useEffect(() => {
    initializeMap({ setMap, mapContainer });
    //toggle between different filters - all, electric bikes, available bikes?
  }, [filtered]);

  //call Mapbox Directions API
  const callDirAPI = (origin, destination) => {
    // see API.js - takes in origin coordinates and destination coordinates
    API.searchRouteDir(
      `${origin[0]},${origin[1]}`,
      `${destination[0]},${destination[1]}`
    ).then((res) => {
      //mapbox directions api result
      console.log(res.data);
      //https://docs.mapbox.com/mapbox-gl-js/example/geojson-line/
      //https://docs.mapbox.com/help/tutorials/getting-started-directions-api/
      const resdata = res.data.routes[0];
      console.log(resdata.duration);
      console.log(resdata.distance);
      const displayroute = resdata.geometry.coordinates;
      //console.log(displayroute);
      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: displayroute,
        },
      };
      console.log(geojson);

      // if the route already exists on the map, reset it using setData
      if (map.getSource("displayroute")) {
        map.getSource("displayroute").setData(geojson);
      } else {
        // otherwise, make a new request
        map.addLayer({
          id: "displayroute",
          type: "line",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: displayroute,
              },
            },
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3887be",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }
    });
  };

  return (
    <div>
      <Sidebar>
        <button onClick={() => submit()}>Save</button>
        <button onClick={() => removeRoute()}>Remove</button>
        <button onClick={() => toggleLayerM()}>Toggle markers</button>
        <button onClick={() => toggleLayerR()}>Toggle routes</button>
        {exroutes.map((exroute, i) => (
          <div>
            <li
              key={i}
              className="listItem"
              onClick={() => callDirAPI(exroute.origin, exroute.destination)}
            >
              FROM: {exroute.ostation_name}
              <br></br>
              TO: {exroute.dstation_name}
            </li>
            <button onClick={() => delRoute(exroute._id)}>del</button>
          </div>
        ))}
      </Sidebar>
      <div className="mapWrapper">
        <div ref={(el) => (mapContainer.current = el)} style={styles} />
      </div>
    </div>
  );
};

/*origin: {exroute.origin[0]},{exroute.origin[1]}
            <br></br>
            destination: {exroute.destination[0]},{exroute.destination[1]}*/
