import React from "react"
import { useAuth0 } from "@auth0/auth0-react";

export const LoginButton = () => {
    const { loginWithRedirect } = useAuth0();

    return <button className="nav-btn" onClick={() => {
        console.log("clicked")
        loginWithRedirect()
    }}>Log In</button>
};

export const LogoutButton = () => {
    const { logout } = useAuth0();

    return <button className="nav-btn" onClick={() => logout()}>Log Out</button>;
};


export const Nav = (props) => {
    const { user } = useAuth0();

    return <div className="nav">
        {user ? <LogoutButton /> : <LoginButton />}
    </div>
}
