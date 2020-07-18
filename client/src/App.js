import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from "./components/Sidebar";
import './App.css';

//core Mapbox API
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

//import MapboxDirections 
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

//https://www.npmjs.com/package/@turf/distance
import distance from '@turf/distance';
//https://www.npmjs.com/package/@turf/buffer
import buffer from '@turf/buffer';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const containercss = {
  width: "66.6666vw",
  height: "100vh"
  // position: "absolute"
};

export const App = () => {
  const [map, setMap] = useState(null);
  const [stations, setStations] = useState();
  const mapContainer = useRef(null);

  const initializeMap = ({ setMap, mapContainer }) => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v10", // stylesheet location
      center: [-75.1652, 39.9526],
      zoom: 12
    });

    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/cycling'
    });

    map.addControl(directions, 'top-left');

    console.log(stations);
    map.on("load", () => {
      setMap(map);
      map.resize();

      map.loadImage(
        'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
        function (error, image) {
          if (error) throw error;
          map.addImage('custom-marker', image);

          //feed indego station geojson data here
          map.addSource('points', {
            'type': 'geojson',
            'data': {
              'type': 'FeatureCollection',
              'features': stations
            }
          });

          // Add a symbol layer
          map.addLayer({
            'id': 'points',
            'type': 'symbol',
            'source': 'points',
            'layout': {
              'icon-image': 'custom-marker',
              "icon-allow-overlap": true
            }
          });
        }
      );

    });
  };

  useEffect(() => {
    fetch("https://kiosks.bicycletransit.workers.dev/phl/")
      .then(res => res.json())
      .then(data => {
        //console.log(data);
        setStations(data['features'])
        //console.log(stations);
        //initializeMap({ setMap, mapContainer });
      })
    // if (!map) initializeMap({ setMap, mapContainer });

  }, []);

  useEffect(() => {
    initializeMap({ setMap, mapContainer });
  }, [stations])



  return (
    <div>
      <Sidebar>
        {stations ? <ul>{
          stations.map((arr) => (
            //JSON.stringify(stations)
            <li key={arr.properties.id}>
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
          ))} </ul> : "none"}

      </Sidebar>
      <div className="mapWrapper">
        <div ref={el => (mapContainer.current = el)} style={containercss} />
      </div>
    </div>
  )


}