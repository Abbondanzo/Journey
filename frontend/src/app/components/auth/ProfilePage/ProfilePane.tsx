import ProfileImage from '@app/containers/util/ProfileImage';
import { User } from '@app/models';
import * as React from 'react';
import './style.scss';

export namespace ProfilePane {
    export interface Props {
        loggedInUser: User;
        userProfile: User;
        userImage: string;
    }
}

export class ProfilePane extends React.Component<ProfilePane.Props> {
    constructor(props: ProfilePane.Props) {
        super(props);
    }

    getButton() {
        const buttonFunction: { action: () => void; text: string } = {
            action: () => {},
            text: 'Follow'
        };
        if (this.props.loggedInUser.uid !== this.props.userProfile.uid) {
            if (
                this.props.loggedInUser.profileDetails.following.indexOf(
                    this.props.userProfile.uid
                ) !== -1
            ) {
                buttonFunction.text = 'Unfollow';
            } else {
                buttonFunction.text = 'Follow';
            }
        } else {
            buttonFunction.text = 'Edit';
        }
        return (
            <button
                className="btn btn-primary btn-block btn-follow w-100"
                onClick={buttonFunction.action}
            >
                {buttonFunction.text}
            </button>
        );
    }

    render() {
        return (
            <div className="list-group-item">
                <div className="profile-pane">
                    <ProfileImage
                        userId={this.props.userProfile.uid}
                        className="profile-pane-img"
                    />
                    <h1>{this.props.userProfile.displayName}</h1>
                    <strong>{this.props.userProfile.email}</strong>
                    {this.getButton()}
                </div>
            </div>
        );
    }
}
