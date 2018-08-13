import { UserActions } from '@app/actions';
import { ProfilePane } from '@app/components/auth/ProfilePage/ProfilePane';
import { LoggedInUser } from '@app/models';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export namespace ProfilePage {
    export interface Props extends RouteComponentProps<any> {
        loggedInUser?: LoggedInUser;
        userImage: string;
        actions: UserActions;
    }
}

export class ProfilePage extends React.Component<ProfilePage.Props> {
    constructor(props: ProfilePage.Props) {
        super(props);
    }

    componentWillReceiveProps(props: ProfilePage.Props) {
        // Automatically redirect to login if we're not logged in
        if (!props.loggedInUser) {
            this.props.history.replace('/login');
        }
    }

    render() {
        return (
            <div className="profile-container">
                {this.props.loggedInUser ? (
                    <div className="row">
                        <div className="col-md-4">
                            <ProfilePane
                                loggedInUser={this.props.loggedInUser}
                                userImage={this.props.userImage}
                            />
                        </div>
                        <div className="col-md-8">Posts</div>
                    </div>
                ) : (
                    undefined
                )}
            </div>
        );
    }
}
