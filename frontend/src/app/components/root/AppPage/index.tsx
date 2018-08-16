import { UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import { Alert } from '@app/components/util/Alert';
import { Navbar } from '@app/components/util/Navbar';
import Login from '@app/containers/auth/Login';
import Profile from '@app/containers/auth/Profile';
import Dashboard from '@app/containers/dashboard/Dashboard';
import Home from '@app/containers/Home';
import { User } from '@app/models';
import * as React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router';
import './style.scss';

export namespace AppPage {
    export interface Props extends RouteComponentProps<void> {
        loggedInUser?: User;
        successMessage?: string;
        errorMessage?: string;
        actions: UserActions & UtilActions;
    }
}

export class AppPage extends React.Component<AppPage.Props> {
    componentDidMount() {
        this.props.actions.getLoggedInUser();
    }
    render() {
        return (
            <div className="root">
                <Alert
                    message={this.props.successMessage}
                    isError={false}
                    hideMessage={this.props.actions.hideSuccess}
                />
                <Alert
                    message={this.props.errorMessage}
                    isError={true}
                    hideMessage={this.props.actions.hideError}
                />
                <Navbar
                    loggedInUser={this.props.loggedInUser}
                    actions={this.props.actions}
                    location={this.props.location}
                    history={this.props.history}
                />
                <div className="container full-height">
                    <Switch>
                        <Route path="/profile" component={Profile} />
                        <Route path="/login" component={Login} />
                        <Route path="/map" component={Dashboard} />
                        {/* Home is default unless we specify exact=true */}
                        <Route path="/" component={Home} />
                    </Switch>
                </div>
            </div>
        );
    }
}
