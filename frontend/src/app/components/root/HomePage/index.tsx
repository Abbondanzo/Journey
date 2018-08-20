import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import './index.scss';


export namespace HomePage {
    export interface Props extends RouteComponentProps<void> {}
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class HomePage extends React.Component<HomePage.Props> {
    render() {
        return (
            <div className="containers">
                <div className="text">
                    <h3 className="mb-2" id="header">Journey</h3>
                    <p>Track and share locations you have visited with friends. Post images and stories
                    about the places you have been and complete with others to travel the world.</p>
                </div>
                <button
                    className="btn btn-light btn-sm btn-register"
                    onClick={() => console.log("register")}><Link to="/register">Register</Link></button>
                <button
                    className="btn btn-light btn-sm btn-sign-in"
                    onClick={() => console.log("register")}><Link to="/login">Sign In</Link></button>
            </div>
        );
    }
}
