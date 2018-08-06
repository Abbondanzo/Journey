import * as React from 'react';

import Post from '@app/models/Post';

export namespace PostList {
    export interface Props {
        posts: Post[];
        onAddPost(): void;
        onDeletePost(postId: string): void;
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class PostList extends React.Component<PostList.Props> {
    render() {
        const onDeletePost = (postId: string) => {
            return () => {
                this.props.onDeletePost(postId);
            };
        };
        return (
            <div>
                <ul className="list-group">
                    {this.props.posts.map((post: Post, index: number) => {
                        return (
                            <li className="list-group-item" key={index}>
                                <div className="d-flex w-100 justify-content-between">
                                    <h5>{post.title}</h5>
                                    <button
                                        type="button"
                                        className="close"
                                        data-dismiss="modal"
                                        aria-label="Close"
                                        onClick={onDeletePost(post.id)}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <p className="mb-1">{post.description}</p>
                                <small>
                                    {post.geocode ? post.geocode.formatted_address : undefined}
                                </small>
                            </li>
                        );
                    })}
                    <li className="list-group-item" key="-1">
                        <button className="btn btn-primary w-100" onClick={this.props.onAddPost}>
                            Add Post
                        </button>
                    </li>
                </ul>
            </div>
        );
    }
}
