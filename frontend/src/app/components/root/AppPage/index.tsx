import { UserActions } from '@app/actions';
import { Navbar } from '@app/components/util/Navbar';
import Login from '@app/containers/auth/Login';
import Dashboard from '@app/containers/dashboard/Dashboard';
import Home from '@app/containers/Home';
import { LoggedInUser } from '@app/models';
import * as React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router';
import './style.scss';

export namespace AppPage {
    export interface Props extends RouteComponentProps<void> {
        loggedInUser?: LoggedInUser;
        actions: UserActions;
    }
}

export class AppPage extends React.Component<AppPage.Props> {
    render() {
        return (
            <div className="root">
                <Navbar loggedInUser={this.props.loggedInUser} actions={this.props.actions} />
                <Switch>
                    <Route path="/login" component={Login} />
                    <Route path="/map" component={Dashboard} />
                    {/* Home is default unless we specify exact=true */}
                    <Route path="/" component={Home} />
                </Switch>
            </div>
        );
    }
}
