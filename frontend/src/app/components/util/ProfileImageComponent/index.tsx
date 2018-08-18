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

    componentWillReceiveProps(newProps: ProfileImageComponent.Props) {
        console.log(newProps);
    }

    render() {
        const profileImageUrl =
            this.props.profileImages.get(this.props.userId) ||
            this.props.profileImages.get('default');
        console.log(profileImageUrl);
        return (
            <img
                className={'profile-img' + (this.props.className ? ' ' + this.props.className : '')}
                src={profileImageUrl}
            />
        );
    }
}
