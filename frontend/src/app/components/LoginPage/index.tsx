import { UserActions } from '@app/actions';
import * as React from 'react';

export namespace LoginPage {
    export interface Props {
        actions: UserActions;
    }
}

export class LoginPage extends React.Component<LoginPage.Props> {
    render() {
        return <div>Login page</div>;
    }
}
