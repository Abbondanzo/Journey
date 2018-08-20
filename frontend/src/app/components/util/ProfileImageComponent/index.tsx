import * as React from 'react';
import './style.scss';

export namespace ProfileImageComponent {
    export interface Props {
        className?: string;
        userId: string;
        profileImages: Map<string, string>;
    }
}

export class ProfileImageComponent extends React.Component<ProfileImageComponent.Props> {
    constructor(props: ProfileImageComponent.Props) {
        super(props);
    }

    render() {
        const profileImageUrl =
            this.props.profileImages.get(this.props.userId) ||
            this.props.profileImages.get('default');
        return (
            <div
                className={
                    'profile-img-container' +
                    (profileImageUrl ? ' profile-img-loaded' : '') +
                    (this.props.className ? ' ' + this.props.className : '')
                }
            >
                {profileImageUrl ? (
                    <img className="profile-img" src={profileImageUrl} />
                ) : (
                    undefined
                )}
            </div>
        );
    }
}
