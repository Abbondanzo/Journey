import Post from '@app/models/Post';
import * as React from 'react';

import { Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

export namespace HomePage {
    export interface Props extends RouteComponentProps<void> {
        posts: Post[];
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class HomePage extends React.Component<HomePage.Props> {
    render() {
        return (
            <div>
                <ul className="list-group">
                    {this.props.posts.length ? (
                        this.props.posts.map((post, index) => {
                            return (
                                <div className="list-group-item list-group-item-action" key={index}>
                                    {post.title}
                                </div>
                            );
                        })
                    ) : (
                        <li className="list-group-item">
                            No posts by users you follow. Create a post now!
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}
