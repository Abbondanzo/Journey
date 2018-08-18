import ProfileImage from '@app/containers/util/ProfileImage';
import { User } from '@app/models';
import * as React from 'react';
import './style.scss';

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
            <div className="list-group-item">
                <div className="profile-pane">
                    <ProfileImage
                        userId={this.props.loggedInUser.uid}
                        className="profile-pane-img"
                    />
                    <h1>{this.props.loggedInUser.displayName}</h1>
                    <strong>{this.props.loggedInUser.email}</strong>
                </div>
            </div>
        );
    }
}
