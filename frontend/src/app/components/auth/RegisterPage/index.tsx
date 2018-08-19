import { UserActions } from '@app/actions';
import { User } from '@app/models';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import './style.scss';

export namespace RegisterPage {
    export interface Props extends RouteComponentProps<any> {
        loggedInUser?: User;
        actions: UserActions;
    }
    export interface State {
        email: string;
        emailError: string;
        password: string;
        passwordError: string;
        verifyPassword: string;
        verifyPasswordError: string;
    }
}

export class RegisterPage extends React.Component<RegisterPage.Props, RegisterPage.State> {
    constructor(props: RegisterPage.Props) {
        super(props);
        this.state = {
            email: '',
            emailError: '',
            password: '',
            passwordError: '',
            verifyPassword: '',
            verifyPasswordError: ''
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.register = this.register.bind(this);
    }

    componentWillReceiveProps(props: RegisterPage.Props) {
        // Automatically redirect to profile if we're logged in
        if (props.loggedInUser) {
            this.props.history.replace('/profile');
        }
    }

    handleInputChange(event: React.FormEvent<HTMLInputElement>) {
        const value = event.currentTarget.value;
        const name = event.currentTarget.name;
        switch (name) {
            case 'email-field':
                this.setState({
                    email: value,
                    emailError: ''
                });
                break;
            case 'password-field':
                this.setState({
                    password: value,
                    passwordError: ''
                });
                break;
            case 'verify-password-field':
                this.setState({
                    verifyPassword: value,
                    verifyPasswordError: ''
                });
                break;
        }
    }

    register() {
        let emailError = this.state.emailError;
        let passwordError = this.state.passwordError;
        let verifyPasswordError = this.state.verifyPasswordError;
        if (!this.state.email) {
            emailError = 'Please use a valid email';
        }
        if (!this.state.password) {
            passwordError = 'Please use a valid password';
        }
        if (this.state.password !== this.state.verifyPassword) {
            verifyPasswordError = 'Password fields do not match. Please try again';
        }
        if (emailError || passwordError || verifyPasswordError) {
            this.setState({
                emailError,
                passwordError,
                verifyPasswordError
            });
        } else {
            this.props.actions.register({
                email: this.state.email,
                password: this.state.password
            });
        }
    }

    render() {
        return (
            <div className="register-container">
                <div className="list-group-item">
                    <h2 className="form-title">Register</h2>
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
                    <div className="form-group">
                        <label htmlFor="verify-password-field">Verify Password</label>
                        <input
                            type="password"
                            className="form-control"
                            name="verify-password-field"
                            id="verify-password-field"
                            placeholder="Password"
                            value={this.state.verifyPassword}
                            onChange={this.handleInputChange}
                        />
                        {this.state.verifyPasswordError ? (
                            <div className="alert alert-danger">
                                {this.state.verifyPasswordError}
                            </div>
                        ) : (
                            undefined
                        )}
                    </div>
                    <button
                        className="btn btn-lg btn-primary btn-block"
                        onClick={this.register}
                        disabled={
                            this.state.emailError !== '' ||
                            this.state.passwordError !== '' ||
                            this.state.verifyPasswordError !== ''
                        }
                    >
                        Register
                    </button>
                    <div className="form-group form-small">
                        <small>
                            Already have an account? <Link to="/login">Login</Link>
                        </small>
                    </div>
                </div>
            </div>
        );
    }
}
