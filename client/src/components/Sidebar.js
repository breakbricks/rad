import React from "react";
import "../App.css";

export const Sidebar = (props) => {
    return <div className='sidebar'>

        <div className='heading'>
            <h1>INDEGO BIKE STATIONS</h1>
        </div>

        <div className="stationList">
            {props.children}
        </div>

    </div>
}