import Post from '@app/models/Post';
import * as React from 'react';

export namespace PostList {
    export interface Props {
        posts: Post[];
        onAddPost(): void;
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class PostList extends React.Component<PostList.Props> {
    render() {
        return (
            <div>
                <ul className="list-group">
                    {this.props.posts.map((post: Post, index: number) => {
                        return (
                            <li className="list-group-item" key={index}>
                                <div className="w-100">
                                    <h5 className="mb-1">{post.title}</h5>
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
