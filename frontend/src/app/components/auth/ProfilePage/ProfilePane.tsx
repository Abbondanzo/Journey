import { UserActions } from '@app/actions';
import ProfileImage from '@app/containers/util/ProfileImage';
import { User } from '@app/models';
import * as React from 'react';
import './style.scss';

export namespace ProfilePane {
    export interface Props {
        loggedInUser: User;
        userProfile: User;
        userImage: string;
        actions: UserActions;
    }
    export interface State {
        isEditing: boolean;
        displayName: string;
        fileRef: React.RefObject<HTMLInputElement>;
        file?: File;
    }
}

export class ProfilePane extends React.Component<ProfilePane.Props, ProfilePane.State> {
    constructor(props: ProfilePane.Props) {
        super(props);
        this.state = {
            isEditing: false,
            displayName: '',
            fileRef: React.createRef()
        };
        this.onInputChange = this.onInputChange.bind(this);
        this.onSave = this.onSave.bind(this);
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
                buttonFunction.action = () => {
                    this.props.actions.unfollowUser({
                        follower: this.props.loggedInUser.uid,
                        following: this.props.userProfile.uid
                    });
                };
                buttonFunction.text = 'Unfollow';
            } else {
                buttonFunction.action = () => {
                    this.props.actions.followUser({
                        follower: this.props.loggedInUser.uid,
                        following: this.props.userProfile.uid
                    });
                };
                buttonFunction.text = 'Follow';
            }
        } else {
            if (this.state.isEditing) {
                buttonFunction.action = () => {
                    this.onSave();
                    this.setState({
                        isEditing: false
                    });
                };
                buttonFunction.text = 'Save';
            } else {
                buttonFunction.action = () => {
                    this.setState({
                        isEditing: true,
                        displayName: this.props.userProfile.displayName || ''
                    });
                };
                buttonFunction.text = 'Edit';
            }
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

    onInputChange(event: any) {
        const name = event.target.name;
        const value = event.target.value;
        switch (name) {
            case 'profile-image-field':
                const files: FileList = event.target.files;
                if (files && files[0]) {
                    const file = files[0];
                    this.setState({
                        file
                    });
                }
                break;
            case 'profile-displayname-field':
                this.setState({
                    displayName: value
                });
                break;
        }
    }

    onSave() {
        if (this.state.file) {
            this.props.actions.uploadProfileImage(this.state.file);
        }
        if (this.state.displayName !== this.props.userProfile.displayName) {
            const newUser = Object.assign({}, this.props.userProfile, {
                displayName: this.state.displayName
            });
            this.props.actions.updateUser(newUser);
        }
    }

    render() {
        const profileImage = (
            <ProfileImage userId={this.props.userProfile.uid} className="profile-pane-img" />
        );
        return (
            <div className="list-group-item">
                <div className="profile-pane">
                    {this.state.isEditing ? (
                        <div className="profile-details editing">
                            <label htmlFor="profile-image-field">
                                <div className="profile-image-overlay">
                                    Click here to select a different profile image
                                </div>
                                {this.state.file ? (
                                    <div className="img-preview profile-pane-img">
                                        <img src={URL.createObjectURL(this.state.file)} />
                                    </div>
                                ) : (
                                    profileImage
                                )}
                            </label>
                            <input
                                ref={this.state.fileRef}
                                type="file"
                                name="profile-image-field"
                                id="profile-image-field"
                                onChange={this.onInputChange}
                            />
                            <div>
                                <input
                                    type="text"
                                    name="profile-displayname-field"
                                    className="form-control"
                                    value={this.state.displayName}
                                    onChange={this.onInputChange}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="profile-details">
                            {profileImage}
                            <h1>{this.props.userProfile.displayName}</h1>
                            <strong className="profile-email">
                                {this.props.userProfile.email}
                            </strong>
                        </div>
                    )}
                    {this.getButton()}
                </div>
            </div>
        );
    }
}
