import './style.scss';

import * as React from 'react';

import { Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { User } from '@app/models';
import { UserActions } from '@app/actions';

export namespace LoginPage {
    export interface Props extends RouteComponentProps<any> {
        loggedInUser?: User;
        actions: UserActions;
    }
    export interface State {
        email: string;
        emailError: string;
        password: string;
        passwordError: string;
    }
}

export class LoginPage extends React.Component<LoginPage.Props, LoginPage.State> {
    constructor(props: LoginPage.Props) {
        super(props);
        this.state = {
            email: '',
            emailError: '',
            password: '',
            passwordError: ''
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.signIn = this.signIn.bind(this);
    }

    componentWillReceiveProps(props: LoginPage.Props) {
        // Automatically redirect to profile if we're logged in
        if (props.loggedInUser) {
            this.props.history.replace('/profile');
        }
    }

    handleInputChange(event: React.FormEvent<HTMLInputElement>) {
        const value = event.currentTarget.value;
        const name = event.currentTarget.name;
        if (name === 'password-field') {
            this.setState({
                password: value,
                passwordError: ''
            });
        } else {
            this.setState({
                email: value,
                emailError: ''
            });
        }
    }

    signIn() {
        let emailError = this.state.emailError;
        let passwordError = this.state.passwordError;
        if (!this.state.email) {
            emailError = 'Please use a valid email';
        }
        if (!this.state.password) {
            passwordError = 'Please use a valid password';
        }
        if (emailError || passwordError) {
            this.setState({
                emailError,
                passwordError
            });
        } else {
            this.props.actions.signIn({
                email: this.state.email,
                password: this.state.password
            });
        }
    }

    render() {
        return (
            <div className="login-container">
                <div className="list-group-item">
                    <h2 className="form-title">Sign In</h2>
                    <div className="form-group">
                        <label htmlFor="email-field">Email Address</label>
                        <input
                            type="text"
                            className="form-control"
                            name="email-field"
                            id="email-field"
                            placeholder="Email Address"
                            value={this.state.email}
                            onChange={this.handleInputChange}
                        />
                        {this.state.emailError ? (
                            <div className="alert alert-danger">{this.state.emailError}</div>
                        ) : (
                            undefined
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="password-field">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password-field"
                            id="password-field"
                            placeholder="Password"
                            value={this.state.password}
                            onChange={this.handleInputChange}
                        />
                        {this.state.passwordError ? (
                            <div className="alert alert-danger">{this.state.passwordError}</div>
                        ) : (
                            undefined
                        )}
                    </div>
                    <button
                        className="btn btn-lg btn-primary btn-block"
                        onClick={this.signIn}
                        disabled={this.state.emailError !== '' || this.state.passwordError !== ''}
                    >
                        Sign In
                    </button>
                    <div className="form-group form-small">
                        <small>
                            Need to create an account? <Link to="/register">Register</Link>
                        </small>
                    </div>
                </div>
            </div>
        );
    }
}
