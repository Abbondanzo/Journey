import { PostActions } from '@app/actions';
import ProfileImage from '@app/containers/util/ProfileImage';
import { User } from '@app/models';
import Post from '@app/models/Post';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import './style.scss';

export namespace PostRowComponent {
    export interface Props extends RouteComponentProps<any> {
        post: Post;
        postOwner: User | undefined;
        loggedInUser?: User['uid'];
        actions: PostActions;
    }
}

export class PostRowComponent extends React.Component<PostRowComponent.Props> {
    render() {
        const onDeletePost = () => {
            this.props.actions.deletePost(this.props.post.id);
        };
        return (
            <div className="list-group-item">
                <div className="row">
                    <div className="col-1">
                        <ProfileImage
                            className="post-row-img"
                            userId={this.props.postOwner ? this.props.postOwner.uid : ''}
                        />
                    </div>
                    <div className="col-11">
                        <Link to={`/profile/${this.props.post.owner}`}>
                            <strong className="post-row-username">
                                {this.props.postOwner
                                    ? this.props.postOwner.displayName || this.props.postOwner.email
                                    : `User ${this.props.post.owner}`}
                            </strong>
                        </Link>
                        <div className="d-flex w-100 justify-content-between">
                            <h5>{this.props.post.title}</h5>
                            {this.props.loggedInUser &&
                            this.props.loggedInUser === this.props.post.owner ? (
                                <button
                                    type="button"
                                    className="close"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    title="Delete Post"
                                    onClick={onDeletePost}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            ) : (
                                undefined
                            )}
                        </div>
                        <p className="mb-1">{this.props.post.description}</p>
                        <small>
                            {this.props.post.geocode
                                ? this.props.post.geocode.formatted_address
                                : undefined}
                        </small>
                    </div>
                </div>
            </div>
        );
    }
}
