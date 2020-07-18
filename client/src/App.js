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

      const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/cycling'
      });

      map.addControl(directions, 'top-left');

      map.on("load", () => {
        setMap(map);
        map.resize();

        map.loadImage(
          'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png',
          function (error, image) {
            if (error) throw error;
            map.addImage('custom-marker', image);
            // Add a GeoJSON source with 2 points
            map.addSource('points', {
              'type': 'geojson',
              'data': {
                'type': 'FeatureCollection',
                'features': [
                  {
                    // feature for Philly Art Museum
                    'type': 'Feature',
                    'geometry': {
                      'type': 'Point',
                      'coordinates': [
                        -75.1810,
                        39.9656
                      ]
                    },
                    'properties': {
                      'title': 'Art Museum'
                    }
                  },
                  {
                    // feature for Jefferson
                    'type': 'Feature',
                    'geometry': {
                      'type': 'Point',
                      'coordinates': [-75.1580, 39.9496]
                    },
                    'properties': {
                      'title': 'Jefferson'
                    }
                  }
                ]
              }
            });

            // Add a symbol layer
            map.addLayer({
              'id': 'points',
              'type': 'symbol',
              'source': 'points',
              'layout': {
                'icon-image': 'custom-marker',
                // get the title name from the source's "title" property
                'text-field': ['get', 'title'],
                'text-font': [
                  'Open Sans Semibold',
                  'Arial Unicode MS Bold'
                ],
                'text-offset': [0, 1.25],
                'text-anchor': 'top'
              }
            });
          }
        );


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