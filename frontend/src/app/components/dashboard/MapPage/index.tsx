import { PostActions } from '@app/actions';
import { PostList } from '@app/components/post/PostList';
import MapContainer from '@app/containers/dashboard/MapContainer';
import Post from '@app/models/Post';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import './style.scss';

export namespace MapPage {
    export interface Props extends RouteComponentProps<void> {
        posts: Post[];
        googleMapsComponent: React.StatelessComponent;
        actions: PostActions;
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class MapPage extends React.Component<MapPage.Props> {
    constructor(props: MapPage.Props) {
        super(props);
    }

    render() {
        const toggleModal = () => {
            this.props.actions.showPostModal();
        };
        return (
            <div className="row full-height">
                <div className="col-md-4">
                    <PostList
                        posts={this.props.posts}
                        onAddPost={toggleModal}
                        onDeletePost={this.props.actions.deletePost}
                    />
                </div>
                <div className="col-md-8">
                    <MapContainer
                        loadingElement={<div className="map-full-height" />}
                        containerElement={<div className="map-full-height" />}
                        mapElement={<div className="map-full-height" />}
                    />
                </div>
            </div>
        );
    }
}
