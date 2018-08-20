import { PostActions, UserActions } from '@app/actions';
import { ProfilePane } from '@app/components/auth/ProfilePage/ProfilePane';
import PostRow from '@app/containers/post/PostRow';
import { User } from '@app/models';
import Post from '@app/models/Post';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export namespace ProfilePage {
    export interface Props extends RouteComponentProps<any> {
        loggedInUser?: User;
        userProfile?: User;
        isLoading: boolean;
        userImage: string;
        posts: Post[];
        actions: UserActions & PostActions;
    }
}

export class ProfilePage extends React.Component<ProfilePage.Props> {
    constructor(props: ProfilePage.Props) {
        super(props);
    }

    componentWillReceiveProps(props: ProfilePage.Props) {
        // Automatically redirect to login if we're not logged in
        if (!props.loggedInUser && !props.isLoading) {
            this.props.history.replace('/login');
        }
    }

    render() {
        return (
            <div className="profile-container">
                {this.props.userProfile && this.props.loggedInUser ? (
                    <div className="row">
                        <div className="col-md-4">
                            <ProfilePane
                                loggedInUser={this.props.loggedInUser}
                                userProfile={this.props.userProfile}
                                userImage={this.props.userImage}
                                actions={this.props.actions}
                            />
                        </div>
                        <div className="col-md-8">
                            <ul className="list-group">
                                {this.props.posts.map((post: Post, index: number) => {
                                    return <PostRow post={post} key={index} />;
                                })}
                            </ul>
                        </div>
                    </div>
                ) : (
                    undefined
                )}
            </div>
        );
    }
}
