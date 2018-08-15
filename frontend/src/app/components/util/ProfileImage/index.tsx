import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { User } from '@app/models';
import { UserActions } from '@app/actions';

export namespace ProfileImage {
    export interface Props extends Partial<RouteComponentProps<void>> {
        loggedInUser?: User;
        profileImage: string;
        actions: UserActions;
    }
}

export class ProfileImage extends React.Component<ProfileImage.Props> {
    constructor(props: ProfileImage.Props) {
        super(props);
    }

    render() {
        return (
            <div>{this.props.loggedInUser ? <img src={this.props.profileImage} /> : undefined}</div>
        );
    }
}
