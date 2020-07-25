import React from "react";
import "../App.css";
import { Nav } from "./Nav"

export const Sidebar = (props) => {
    return <div className='sidebar'>
        <Nav />
        <div className="stationList">
            {props.children}
        </div>
    </div>
}