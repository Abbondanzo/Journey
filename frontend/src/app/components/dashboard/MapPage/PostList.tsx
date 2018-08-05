import Post from '@app/models/Post';
import * as React from 'react';

export namespace PostList {
    export interface Props {
        posts: Post[];
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
                                {post.description}
                            </li>
                        );
                    })}
                    <li className="list-group-item">
                        <button className="btn btn-primary w-100">Add Post</button>
                    </li>
                </ul>
            </div>
        );
    }
}
