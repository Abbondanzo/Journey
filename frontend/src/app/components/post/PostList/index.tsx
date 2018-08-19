import { PostRow } from '@app/components/post/PostRow';
import Post from '@app/models/Post';
import * as React from 'react';

export namespace PostList {
    export interface Props {
        posts: Post[];
        onAddPost(): void;
        onDeletePost(postId: string): void;
    }
}

export class PostList extends React.Component<PostList.Props> {
    render() {
        console.log(this.props.posts);
        return (
            <div>
                <ul className="list-group">
                    {this.props.posts.map((post: Post, index: number) => {
                        return (
                            <PostRow
                                post={post}
                                key={index}
                                onDeletePost={this.props.onDeletePost}
                            />
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
