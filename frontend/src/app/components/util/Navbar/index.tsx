import { PostActions, UserActions } from '@app/actions';
import ProfileImage from '@app/containers/util/ProfileImage';
import { User, UserRole } from '@app/models/User';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import './style.scss';

export namespace Navbar {
    export interface Props extends Partial<RouteComponentProps<void>> {
        loggedInUser?: User;
        actions: UserActions & PostActions;
    }

    export interface State {}
}

export class Navbar extends React.Component<Navbar.Props, Navbar.State> {
    constructor(props: Navbar.Props) {
        super(props);
        this.state = {};
        this.loginLogout = this.loginLogout.bind(this);
    }

    loginLogout() {
        if (this.props.history) {
            if (this.props.loggedInUser) {
                this.props.actions.logOut();
                this.props.history.push('/login');
            } else {
                this.props.history.push('/login');
            }
        } else {
            console.error('No history prop');
        }
    }

    render() {
        return (
            <nav className="navbar navbar-expand-sm navbar-dark" role="navigation">
                <div className="container">
                    <Link className="navbar-brand" to="/">
                        Journey
                    </Link>
                    <div className="collapse navbar-collapse show">
                        <ul className="navbar-nav">
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
                                    this.props.location &&
                                    `${this.props.location.pathname}` === '/map'
                                        ? 'nav-item active'
                                        : 'nav-item'
                                }
                            >
                                <Link to="/map" className="nav-link">
                                    Map
                                </Link>
                            </li>
                            {this.props.loggedInUser &&
                            this.props.loggedInUser.profileDetails.role ===
                                UserRole.ADMINISTRATOR ? (
                                <li
                                    className={
                                        this.props.location &&
                                        `${this.props.location.pathname}` === '/admin'
                                            ? 'nav-item active'
                                            : 'nav-item'
                                    }
                                >
                                    <Link to="/admin" className="nav-link">
                                        Admin
                                    </Link>
                                </li>
                            ) : (
                                undefined
                            )}
                        </ul>
                        <ul className="navbar-nav ml-auto">
                            {this.props.loggedInUser ? (
                                <li className="nav-item valign">
                                    <button
                                        className="btn btn-light btn-sm btn-add-post"
                                        onClick={this.props.actions.showPostModal}
                                    >
                                        Add Post
                                    </button>
                                </li>
                            ) : (
                                undefined
                            )}
                            {this.props.loggedInUser ? (
                                <li
                                    className={
                                        this.props.location &&
                                        `${this.props.location.pathname}` === '/profile'
                                            ? 'nav-item active'
                                            : 'nav-item'
                                    }
                                >
                                    <Link to="/profile" className="nav-link nav-profile-container ">
                                        <ProfileImage
                                            userId={this.props.loggedInUser.uid}
                                            className="nav-image"
                                        />
                                        Profile
                                    </Link>
                                </li>
                            ) : (
                                undefined
                            )}
                        </ul>
                        <button className="btn btn-outline-light btn-sm" onClick={this.loginLogout}>
                            {this.props.loggedInUser ? 'Logout' : 'Login'}
                        </button>
                    </div>
                </div>
            </nav>
        );
    }
}
