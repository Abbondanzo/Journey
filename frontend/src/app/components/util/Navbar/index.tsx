import { UserActions } from '@app/actions';
import { LoggedInUser } from '@app/models/User';
import * as React from 'react';
import { Link } from 'react-router-dom';
import './style.scss';

export namespace Navbar {
    export interface Props {
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
                        <li className="nav-item active">
                            <a className="nav-link" href="#">
                                Home <span className="sr-only">(current)</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#">
                                Link
                            </a>
                        </li>
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle"
                                href="#"
                                id="navbarDropdown"
                                role="button"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                Dropdown
                            </a>
                            <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                                <a className="dropdown-item" href="#">
                                    Action
                                </a>
                                <a className="dropdown-item" href="#">
                                    Another action
                                </a>
                                <div className="dropdown-divider" />
                                <a className="dropdown-item" href="#">
                                    Something else here
                                </a>
                            </div>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link disabled" href="#">
                                Disabled
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        );
    }
}
