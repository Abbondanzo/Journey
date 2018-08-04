import { UserActions } from '@app/actions';
import Login from '@app/containers/auth/Login';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export namespace AppPage {
    export interface Props extends RouteComponentProps<void> {
        actions: UserActions;
    }
}

export class AppPage extends React.Component<AppPage.Props> {
    render() {
        return (
            <div>
                {/* Some sort of header */}
                {/* Some sort of alert container */}
                {/* Router */}
                <Login />
            </div>
        );
    }
}
