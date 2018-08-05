import { UserActions } from '@app/actions';
import Login from '@app/containers/auth/Login';
import Map from '@app/containers/dashboard/Map';
import Home from '@app/containers/Home';
import * as React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router';

export namespace AppPage {
    export interface Props extends RouteComponentProps<void> {
        actions: UserActions;
    }
}

export class AppPage extends React.Component<AppPage.Props> {
    render() {
        return (
            <div>
                {/* Navbar */}
                <Switch>
                    <Route path="/login" component={Login} />
                    <Route path="/map" component={Map} />
                    {/* Home is default unless we specify exact=true */}
                    <Route path="/" component={Home} />
                </Switch>
            </div>
        );
    }
}
