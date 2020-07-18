import React from "react";
import "../App.css";

export const Sidebar = (props) => {
    return <div className='sidebar'>

        <h1>RAD</h1>

        <p>
            indego station info here?

            {props.children}


        </p>

    </div>
}