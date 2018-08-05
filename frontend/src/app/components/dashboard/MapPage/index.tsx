import { PostList } from '@app/components/dashboard/MapPage/PostList';
import Post from '@app/models/Post';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export namespace MapPage {
    export interface Props extends RouteComponentProps<void> {
        posts: Post[];
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class MapPage extends React.Component<MapPage.Props> {
    render() {
        return (
            <div className="row">
                <div className="col-md-4">
                    <PostList posts={this.props.posts} />
                </div>
                <div className="col-md-8">This is where the map goes</div>
            </div>
        );
    }
}
