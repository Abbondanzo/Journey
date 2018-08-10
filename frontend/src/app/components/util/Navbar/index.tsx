import { UserActions } from '@app/actions';
import { LoggedInUser } from '@app/models/User';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import './style.scss';

export namespace Navbar {
    export interface Props extends Partial<RouteComponentProps<void>> {
        loggedInUser?: LoggedInUser;
        actions: UserActions;
    }

    export interface State {}
}

export class Navbar extends React.Component<Navbar.Props, Navbar.State> {
    constructor(props: Navbar.Props) {
        super(props);
        this.state = {};
    }

    render() {
        return (
            <nav className="navbar navbar-expand-sm navbar-dark" role="navigation">
                <Link className="navbar-brand" to="/">
                    Journey
                </Link>
                <div className="collapse navbar-collapse show">
                    <ul className="navbar-nav ml-auto">
                        <li
                            className={
                                this.props.location && `${this.props.location.pathname}` === '/'
                                    ? 'nav-item active'
                                    : 'nav-item'
                            }
                        >
                            <Link to="/" className="nav-link">
                                Home
                            </Link>
                        </li>
                        <li
                            className={
                                this.props.location && `${this.props.location.pathname}` === '/map'
                                    ? 'nav-item active'
                                    : 'nav-item'
                            }
                        >
                            <Link to="/map" className="nav-link">
                                Map
                            </Link>
                        </li>
                    </ul>
                    <button className="btn btn-light btn-sm btn-login">
                        {this.props.loggedInUser ? 'Logout' : 'Login'}
                    </button>
                </div>
            </nav>
        );
    }
}
