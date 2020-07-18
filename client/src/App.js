import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from "./components/Sidebar";
import './App.css';

//core Mapbox
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

//import MapboxDirections 
//https://www.npmjs.com/package/@mapbox/mapbox-gl-directions
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
  const [filtered, setFiltered] = useState();
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
              'features': filtered
            }
          });

          // Add a symbol layer
          map.addLayer({
            'id': 'indegostations',
            'type': 'symbol',
            'source': 'points',
            'layout': {
              'icon-image': 'custom-marker',
              "icon-allow-overlap": true
            }
          });
        }
      );

      const flyToStation = (current) => {
        map.flyTo({
          center: current.geometry.coordinates,
          zoom: 15
        })
      }

      const createPopUp = (current) => {
        const popUps = document.getElementsByClassName('mapboxgl-popup');
        if (popUps[0]) popUps[0].remove();
        const popup = new mapboxgl.Popup({ closeOnClick: false })
          .setLngLat(current.geometry.coordinates)
          .setHTML(`<h3>${current.properties.name}</h3>
            <p>
            Docks Available: ${JSON.stringify(current.properties.docksAvailable)}
            Bikes Available: ${JSON.stringify(current.properties.bikesAvailable)}
            </p>`)
          .addTo(map);
      }

      map.on('click', function (e) {
        /* Determine if a feature in the "indegostations" layer exists at that point. */
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['indegostations']
        });

        /* If yes, then: */
        if (features.length) {
          const clickedMarker = features[0];
          /* Fly to the point */
          flyToStation(clickedMarker);
          /* Close all other popups and display popup for clicked station */
          createPopUp(clickedMarker);
        }
      });

    });
  };

  useEffect(() => {
    fetch("https://kiosks.bicycletransit.workers.dev/phl/")
      .then(res => res.json())
      .then(data => {
        //console.log(data);
        setStations(data['features'])
        //filter by electric bikes available
        setFiltered(
          data['features'].filter(s => s.properties.electricBikesAvailable > 0)
        )
        //console.log(stations);
        //initializeMap({ setMap, mapContainer });
      })
    // if (!map) initializeMap({ setMap, mapContainer });
  }, []);

  useEffect(() => {
    initializeMap({ setMap, mapContainer });


  }, [filtered])






  return (
    <div>
      <Sidebar>

        {filtered ? <div> {
          filtered.map((arr) => (
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
          ))} </div> : "error"}

      </Sidebar>
      <div className="mapWrapper">
        <div ref={el => (mapContainer.current = el)} style={containercss} />
      </div>
    </div>
  )


}