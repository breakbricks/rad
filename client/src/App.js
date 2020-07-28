import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from "./components/Sidebar";
import { Profile } from "./components/Profile";
import { UserMap } from "./components/UserMap";
import { PublicMap } from "./components/PublicMap";
import { useAuth0 } from "@auth0/auth0-react";

import './App.css';

export const App = () => {

    const { isAuthenticated } = useAuth0();

    return (
        <div>
            <Sidebar>
                <Profile></Profile>
            </Sidebar>

            <div className="mapWrapper">

                {isAuthenticated ?
                    (<UserMap></UserMap>) :
                    (<PublicMap></PublicMap>)
                }

            </div>;
        </div>
    )
};

