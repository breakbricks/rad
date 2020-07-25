import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

import icon from "../assets/icon.png"
import '../App.css';

//core Mapbox
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

//import MapboxDirections 
//https://www.npmjs.com/package/@mapbox/mapbox-gl-directions
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

const containercss = {
    width: "66.6666vw",
    height: "100vh"
    // position: "absolute"
};
