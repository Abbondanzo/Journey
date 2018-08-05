import { PostList } from '@app/components/dashboard/MapPage/PostList';
import MapContainer from '@app/containers/dashboard/MapContainer';
import Post from '@app/models/Post';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import './style.scss';

export namespace MapPage {
    export interface Props extends RouteComponentProps<void> {
        posts: Post[];
        googleMapsComponent: React.StatelessComponent;
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class MapPage extends React.Component<MapPage.Props> {
    render() {
        return (
            <div className="row full-height">
                <div className="col-md-4">
                    <PostList posts={this.props.posts} />
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
