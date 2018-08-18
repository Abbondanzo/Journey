import './style.scss';

import * as React from 'react';

import MapContainer from '@app/containers/dashboard/MapContainer';
import { NewPost } from '@app/components/dashboard/MapPage/NewPost';
import Post from '@app/models/Post';
import { PostActions } from '@app/actions';
import { PostList } from '@app/components/dashboard/MapPage/PostList';
import { RouteComponentProps } from 'react-router';

export namespace MapPage {
    export interface Props extends RouteComponentProps<void> {
        posts: Post[];
        googleMapsComponent: React.StatelessComponent;
        actions: PostActions;
    }

    export interface State {
        showModal: boolean;
        postSearch: string;
    }
}

let searchPost = '';

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class MapPage extends React.Component<MapPage.Props, MapPage.State> {
    constructor(props: MapPage.Props) {
        super(props);
        this.state = {
            showModal: false,
            postSearch: '',
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

    updateSearch = () => {
        this.setState({postSearch: searchPost});
        console.log(this.state.postSearch);
    };

    render() {
        const toggleModal = (shouldShow: boolean) => () => {
            this.setState({ showModal: shouldShow });
        };
        return (
            <div className="row full-height">
                <div className="col-md-4">
                    <input type="text"
                           className="form-control"
                           ref={node=>node==null ? searchPost='' : searchPost=node.value}
                           onChange={() => this.updateSearch()}
                           placeholder="Search"/>
                    <PostList
                        posts={this.props.posts}
                        searchPost={searchPost}
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
