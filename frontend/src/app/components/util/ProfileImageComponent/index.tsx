import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import './style.scss';

export namespace ProfileImageComponent {
    export interface Props extends Partial<RouteComponentProps<void>> {
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
            <img
                className={'profile-img' + (this.props.className ? ' ' + this.props.className : '')}
                src={profileImageUrl}
            />
        );
    }
}
