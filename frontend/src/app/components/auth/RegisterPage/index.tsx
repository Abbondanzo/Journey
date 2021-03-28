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
        email: FieldError;
        username: FieldError;
        password: FieldError;
        verifyPassword: FieldError;
    }
}

interface FieldError {
    field: string;
    error: string;
}

export class RegisterPage extends React.Component<RegisterPage.Props, RegisterPage.State> {
    constructor(props: RegisterPage.Props) {
        super(props);
        this.state = {
            email: {
                field: '',
                error: ''
            },
            username: {
                field: '',
                error: ''
            },
            password: {
                field: '',
                error: ''
            },
            verifyPassword: {
                field: '',
                error: ''
            }
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
                    email: {
                        field: value,
                        error: ''
                    }
                });
                break;
            case 'username-field':
                this.setState({
                    username: {
                        field: value,
                        error: ''
                    }
                });
                break;
            case 'password-field':
                this.setState({
                    password: {
                        field: value,
                        error: ''
                    }
                });
                break;
            case 'verify-password-field':
                this.setState({
                    verifyPassword: {
                        field: value,
                        error: ''
                    }
                });
                break;
        }
    }

    register() {
        let nameError = this.state.username.error;
        let emailError = this.state.email.error;
        let passwordError = this.state.password.error;
        let verifyPasswordError = this.state.verifyPassword.error;
        if (!this.state.username.field) {
            nameError = 'Please register with your name';
        }
        if (!this.state.email.field) {
            emailError = 'Please use a valid email';
        }
        if (!this.state.password.field) {
            passwordError = 'Please use a valid password';
        }
        if (this.state.password.field !== this.state.verifyPassword.field) {
            verifyPasswordError = 'Password fields do not match. Please try again';
        }
        if (emailError || passwordError || verifyPasswordError) {
            this.setState({
                username: {
                    field: this.state.username.field,
                    error: nameError
                },
                email: {
                    field: this.state.email.field,
                    error: emailError
                },
                password: {
                    field: this.state.password.field,
                    error: passwordError
                },
                verifyPassword: {
                    field: this.state.verifyPassword.field,
                    error: verifyPasswordError
                }
            });
        } else {
            this.props.actions.register({
                username: this.state.username.field,
                email: this.state.email.field,
                password: this.state.password.field
            });
        }
    }

    render() {
        return (
            <div className="register-container">
                <div className="list-group-item">
                    <h2 className="form-title">Register</h2>
                    <div className="form-group">
                        <label htmlFor="username-field">Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="username-field"
                            id="username-field"
                            placeholder="First and Last Name"
                            value={this.state.username.field}
                            onChange={this.handleInputChange}
                        />
                        {this.state.username.error ? (
                            <div className="alert alert-danger">{this.state.username.error}</div>
                        ) : (
                            undefined
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="email-field">Email Address</label>
                        <input
                            type="text"
                            className="form-control"
                            name="email-field"
                            id="email-field"
                            placeholder="Email Address"
                            value={this.state.email.field}
                            onChange={this.handleInputChange}
                        />
                        {this.state.email.error ? (
                            <div className="alert alert-danger">{this.state.email.error}</div>
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
                            value={this.state.password.field}
                            onChange={this.handleInputChange}
                        />
                        {this.state.password.error ? (
                            <div className="alert alert-danger">{this.state.password.error}</div>
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
                            value={this.state.verifyPassword.field}
                            onChange={this.handleInputChange}
                        />
                        {this.state.verifyPassword.error ? (
                            <div className="alert alert-danger">
                                {this.state.verifyPassword.error}
                            </div>
                        ) : (
                            undefined
                        )}
                    </div>
                    <button
                        className="btn btn-lg btn-primary btn-block"
                        onClick={this.register}
                        disabled={
                            this.state.email.error !== '' ||
                            this.state.password.error !== '' ||
                            this.state.verifyPassword.error !== ''
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
