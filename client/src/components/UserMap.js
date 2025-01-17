import React, { useState, useEffect, useRef } from "react";
import Moment from "react-moment";

import icon from "../assets/icon.png";
import "../App.css";
import { Sidebar } from "./Sidebar";
import { Profile } from "./Profile";

import API from "../utils/API";
import dirstyles from "../dirstyles.json";

//https://www.npmjs.com/package/@turf/bearing
import turf from "@turf/turf";
import bearing from "@turf/bearing";

//core Mapbox
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

//import Auth0
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
  const [bfiltered, setBFiltered] = useState();
  const [dfiltered, setDFiltered] = useState();
  const [efiltered, setEFiltered] = useState();
  const [lanes, setLanes] = useState();
  const [crashes, setCrashes] = useState();
  const mapContainer = useRef(null);
  //route to save
  const [route, setRoute] = useState([]);
  //existing/saved routes
  const [exroutes, setExRoutes] = useState([]);

  //https://github.com/mapbox/mapbox-gl-directions/blob/master/src/directions_style.js
  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    styles: dirstyles,
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
    alternatives: false,
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

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    //console.log(stations);

    map.on("load", () => {
      setMap(map);
      map.resize();

      //console.log(efiltered);
      //console.log(lanes);

      //=====collisions data layer======/
      map.addLayer({
        id: "collisions",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: crashes,
          },
        },
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["number", ["get", "tot_inj_count"]],
            0,
            4,
            5,
            24,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["number", ["get", "tot_inj_count"]],
            0,
            "#2DC4B2",
            1,
            "#3BB3C3",
            2,
            "#669EC4",
            3,
            "#8B88B6",
            4,
            "#A2719B",
            5,
            "#AA5E79",
          ],
          "circle-opacity": 0.8,
        },
      });

      //======bike lane layer========/
      //https://www.opendataphilly.org/dataset/bike-network/resource/8f30d7e4-127a-4cc0-9df3-6db7bcca41be

      map.addLayer({
        id: "bikelanes",
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: lanes,
          },
        },
        layout: {
          // make layer visible by default
          visibility: "visible",
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#877b59",
          "line-width": 1,
        },
      });

      //add ebikestations layer
      map.addLayer({
        id: "ebikestations",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: efiltered,
          },
        },
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": 8,
          "circle-color": "rgba(55,148,179,1)",
        },
      });

      //add docks available stations layer
      map.addLayer({
        id: "dstations",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: dfiltered,
          },
        },
        layout: {
          visibility: "none",
        },
        paint: {
          "circle-radius": 8,
          "circle-color": "#c8c700",
        },
      });

      map.loadImage(
        // 'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
        icon,
        function (error, image) {
          if (error) throw error;
          map.addImage("custom-marker", image);

          //feed FILTERED indego station geojson data here
          map.addSource("points", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: bfiltered,
            },
          });

          // Add a symbol layer
          map.addLayer({
            id: "bikestations",
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
          zoom: 12,
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
        // check if a feature in the "bikestations" layer exists
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["bikestations", "ebikestations", "dstations"],
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

  //toggle bikestations markers layer
  const toggleLayerB = () => {
    const visibility = map.getLayoutProperty("bikestations", "visibility");
    if (visibility === "visible") {
      map.setLayoutProperty("bikestations", "visibility", "none");
    } else {
      map.setLayoutProperty("bikestations", "visibility", "visible");
    }
  };

  const toggleLayerD = () => {
    //console.log(map.getStyle().layers);
    const visibility = map.getLayoutProperty("dstations", "visibility");
    if (visibility === "none") {
      map.setLayoutProperty("dstations", "visibility", "visible");
    } else {
      map.setLayoutProperty("dstations", "visibility", "none");
    }
  };

  const toggleLayerCol = () => {
    // collisions
    const visibility = map.getLayoutProperty("collisions", "visibility");
    if (visibility === "none") {
      map.setLayoutProperty("collisions", "visibility", "visible");
    } else {
      map.setLayoutProperty("collisions", "visibility", "none");
    }
  };

  const toggleLayerE = () => {
    // console.log(map.getStyle().layers);
    const visibility = map.getLayoutProperty("ebikestations", "visibility");
    if (visibility === "none") {
      map.setLayoutProperty("ebikestations", "visibility", "visible");
    } else {
      map.setLayoutProperty("ebikestations", "visibility", "none");
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

  //toggle bike lanes layer
  const toggleLayerBL = () => {
    const visibility = map.getLayoutProperty("bikelanes", "visibility");
    if (visibility === "visible") {
      map.setLayoutProperty("bikelanes", "visibility", "none");
    } else {
      map.setLayoutProperty("bikelanes", "visibility", "visible");
    }
  };

  const removeRoute = () => {
    //removeRoutes()
    //https://github.com/mapbox/mapbox-gl-directions/blob/master/API.md

    directions.removeRoutes();
    //map.removeControl(directions);

    // GET ALL THE LAYERS - find out which layer is the route
    //console.log(map.getStyle().layers);
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
        //filter by bikes available
        setBFiltered(
          data["features"].filter((s) => s.properties.bikesAvailable > 0)
        );
        //filter by docks available
        setDFiltered(
          data["features"].filter((s) => s.properties.docksAvailable > 0)
        );
        //filter by electric bikes available
        setEFiltered(
          data["features"].filter(
            (s) => s.properties.electricBikesAvailable > 0
          )
        );
        //console.log(stations);
        //initializeMap({ setMap, mapContainer });
      });

    //bike lanes
    const proxyurl = "https://cors-anywhere.herokuapp.com/";
    const url =
      "http://data.phl.opendata.arcgis.com/datasets/b5f660b9f0f44ced915995b6d49f6385_0.geojson";
    fetch(proxyurl + url)
      .then((res) => res.json())
      .then((data) => {
        setLanes(data.features);
      })
      .catch((err) => console.log(err));

    //crashes involving bikes
    //https://www.opendataphilly.org/dataset/vehicular-crash-data
    //https://cityofphiladelphia.github.io/carto-api-explorer/#crash_data_collision_crash_2007_2017
    const crashurl =
      "https://phl.carto.com/api/v2/sql?q=SELECT%20*%20FROM%20crash_data_collision_crash_2007_2017%20WHERE%20bicycle_maj_inj_count%3E=1%20OR%20bicycle_death_count%20%3E=1";

    fetch(proxyurl + crashurl)
      .then((res) => res.json())
      .then((data) => {
        const crashdata = data.rows;
        //console.log(crashdata);
        const newcrashdata = crashdata.map((obj) => ({
          ...obj,
          properties: {
            tot_inj_count: obj.tot_inj_count,
            bicycle_count: obj.bicycle_count,
            person_count: obj.person_count,
            collision_type: obj.collision_type,
          },
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [obj.dec_long, obj.dec_lat],
          },
        }));
        console.log(newcrashdata);
        setCrashes(newcrashdata);

        //for each object in the array, add property of geometry
        /* type: "Feature",
    geometry: {
        coordinates: [-75, 39],
        type: "Point"
    }
    [dec_long, dec_lat]
    */
      })
      .catch((err) => console.log(err));

    /*fetch("/api/test")
      .then((response) => response.json())
      .then((res) => console.log(res))
      .catch((err) => console.log(err));*/
  }, []);

  useEffect(() => {
    initializeMap({ setMap, mapContainer });
  }, [bfiltered, efiltered, lanes, crashes]);

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
      const origin = res.data.waypoints[0].location;
      const destination = res.data.waypoints[1].location;

      //resdata.legs[0].steps[i].maneuver.instruction //"Head south on North Broad Street (PA 611)"
      //modal?
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
      // console.log(geojson);

      // Create a popup for the saved route <li>
      const rpopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      //display distancee and duration information on hover
      map.on("mouseenter", "displayroute", function (e) {
        rpopup
          .setLngLat(e.lngLat)
          .setHTML(
            ` <p> Duration: ${Math.floor(resdata.duration / 60)} min 
                Distance: ${+(resdata.distance / 1000).toFixed(2)} km <p>`
          )
          .addTo(map);
      });

      map.on("mouseenter", "states-layer", function () {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "displayroute", function () {
        map.getCanvas().style.cursor = "";
        rpopup.remove();
      });

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
            "line-width": 7,
            "line-opacity": 0.75,
          },
        });
      }

      // Used to increment the value of the point measurement against the route.
      let counter = 0;

      const steps = 500;

      //origin point
      const opoint = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: origin,
            },
          },
        ],
      };

      map.addSource("opoint", {
        type: "geojson",
        data: opoint,
      });

      //https://map.michelstuyts.be/icons/
      map.addLayer({
        id: "opoint",
        source: "opoint",
        type: "symbol",
        layout: {
          "icon-image": "bicycle-15",
          "icon-ignore-placement": true,
        },
      });

      //dest point
      const dpoint = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: destination,
            },
          },
        ],
      };

      map.addSource("dpoint", {
        type: "geojson",
        data: dpoint,
      });

      //https://map.michelstuyts.be/icons/
      map.addLayer({
        id: "dpoint",
        source: "dpoint",
        type: "symbol",
        layout: {
          "icon-image": "bicycle-15",
          "icon-ignore-placement": true,
        },
      });
    });
  };

  return (
    <div>
      <Sidebar>
        <button onClick={() => submit()}>Save</button>
        <button onClick={() => removeRoute()}>Clear</button>
        <button onClick={() => toggleLayerB()}>bikes</button>
        <button onClick={() => toggleLayerD()}>docks</button>
        <button onClick={() => toggleLayerE()}>ebikes</button>
        <button onClick={() => toggleLayerR()}>saved routes</button>
        <button onClick={() => toggleLayerBL()}>bike lanes</button>
        <button onClick={() => toggleLayerCol()}>collisions</button>
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
              <br></br>
              DATE:
              <Moment format="DD MMM YYYY">{exroute.date}</Moment>
              <br></br>
              TIME: <Moment format="hh:mm A">{exroute.date}</Moment>
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
