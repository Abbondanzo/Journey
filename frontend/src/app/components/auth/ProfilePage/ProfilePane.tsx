import * as React from 'react';

import { User } from '@app/models';

export namespace ProfilePane {
    export interface Props {
        loggedInUser: User;
        userImage: string;
    }
}

export class ProfilePane extends React.Component<ProfilePane.Props> {
    constructor(props: ProfilePane.Props) {
        super(props);
    }

    render() {
        return (
            <div className="profile-pane">
                <img src={this.props.userImage} alt="Profile Image" />
                <h1>{this.props.loggedInUser.displayName}</h1>
                <strong>{this.props.loggedInUser.email}</strong>
            </div>
        );
    }
}
