import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from "./components/Sidebar";
import './App.css';

//core Mapbox API
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

//import MapboxDirections 
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const containercss = {
  width: "66.6666vw",
  height: "100vh"
  // position: "absolute"
};

export const App = () => {
  const [map, setMap] = useState(null);
  const [stations, setStations] = useState()
  const mapContainer = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;
    const initializeMap = ({ setMap, mapContainer }) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v10", // stylesheet location
        center: [-75.1652, 39.9526],
        zoom: 12
      });

      map.on("load", () => {
        setMap(map);
        map.resize();
      });
    };

    fetch("https://kiosks.bicycletransit.workers.dev/phl/").then(res => res.json()).then(data => setStations(data))

    if (!map) initializeMap({ setMap, mapContainer });
  }, [map]);

  return (
    <div>
      <Sidebar> {stations ? <p>{JSON.stringify(stations)}</p> : ""}} </Sidebar>

      <div className="mapWrapper">
        <div ref={el => (mapContainer.current = el)} style={containercss} />
      </div>
    </div>
  )


}