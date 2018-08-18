import ProfileImage from '@app/containers/util/ProfileImage';
import { User } from '@app/models';
import * as React from 'react';

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
                <ProfileImage userId={this.props.loggedInUser.uid} />
                <h1>{this.props.loggedInUser.displayName}</h1>
                <strong>{this.props.loggedInUser.email}</strong>
            </div>
        );
    }
}
