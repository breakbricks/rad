import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from "./components/Sidebar";
import { Profile } from "./components/Profile";
import { UserMap } from "./components/UserMap";
import { useAuth0 } from "@auth0/auth0-react";

import './App.css';

//core Mapbox
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const containercss = {
    width: "66.6666vw",
    height: "100vh"
    // position: "absolute"
};

export const App = () => {

    const { isAuthenticated } = useAuth0();

    const [map, setMap] = useState(null);
    const [stations, setStations] = useState();
    const mapContainer = useRef(null);

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

        map.loadImage(
            // standard pin marker 
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

    };

    useEffect(() => {
        fetch("https://kiosks.bicycletransit.workers.dev/phl/")
            .then(res => res.json())
            .then(data => {
                //console.log(data);
                setStations(data['features'])
            })

        fetch("/api/test")
            .then(response => response.json())
            .then(res => console.log(res))
            .catch(err => console.log(err))
    }, []);

    useEffect(() => {
        initializeMap({ setMap, mapContainer });
    }, [stations])

    return (
        <div>
            <Sidebar>
                <Profile></Profile>
            </Sidebar>

            <div className="mapWrapper">

                {isAuthenticated && (
                    <UserMap></UserMap>
                )}
                <div ref={el => (mapContainer.current = el)} style={containercss} />


            </div>;
        </div>
    )
};

