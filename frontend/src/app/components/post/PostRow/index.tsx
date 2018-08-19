import Post from '@app/models/Post';
import * as React from 'react';

export namespace PostRow {
    export interface Props {
        post: Post;
        onDeletePost(postId: string): void;
    }
}

export class PostRow extends React.Component<PostRow.Props> {
    render() {
        const onDeletePost = () => {
            this.props.onDeletePost(this.props.post.id);
        };
        return (
            <div className="list-group-item">
                <div className="d-flex w-100 justify-content-between">
                    <h5>{this.props.post.title}</h5>
                    <button
                        type="button"
                        className="close"
                        data-dismiss="modal"
                        aria-label="Close"
                        onClick={onDeletePost}
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <p className="mb-1">{this.props.post.description}</p>
                <small>
                    {this.props.post.geocode
                        ? this.props.post.geocode.formatted_address
                        : undefined}
                </small>
            </div>
        );
    }
}
