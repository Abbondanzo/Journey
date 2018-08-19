import { PostActions } from '@app/actions';
import { NewPost } from '@app/components/dashboard/MapPage/NewPost';
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

    export interface State {
        showModal: boolean;
    }
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class MapPage extends React.Component<MapPage.Props, MapPage.State> {
    constructor(props: MapPage.Props) {
        super(props);
        this.state = {
            showModal: false
        };
        this.savePost = this.savePost.bind(this);
        this.deletePost = this.deletePost.bind(this);
    }

    savePost(post: Post) {
        this.props.actions.addPost(post);
    }

    deletePost(postId: string) {
        this.props.actions.deletePost(postId);
    }

    render() {
        const toggleModal = (shouldShow: boolean) => () => {
            this.setState({ showModal: shouldShow });
        };
        return (
            <div className="row full-height">
                <div className="col-md-4">
                    <PostList
                        posts={this.props.posts}
                        onAddPost={toggleModal(true)}
                        onDeletePost={this.deletePost}
                    />
                </div>
                <div className="col-md-8">
                    <MapContainer
                        loadingElement={<div className="map-full-height" />}
                        containerElement={<div className="map-full-height" />}
                        mapElement={<div className="map-full-height" />}
                    />
                </div>
                {this.state.showModal ? (
                    <NewPost onSave={this.savePost} onClose={toggleModal(false)} />
                ) : (
                    undefined
                )}
            </div>
        );
    }
}
