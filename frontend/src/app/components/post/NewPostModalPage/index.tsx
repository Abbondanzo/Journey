import { PostActions } from '@app/actions';
import SearchBox from '@app/containers/dashboard/SearchBox';
import { convertPlaceResultToGeocode, User } from '@app/models';
import Post from '@app/models/Post';
import * as React from 'react';
import './style.scss';

export namespace NewPostModalPage {
    export interface Props {
        isShowing: boolean;
        loggedInUser: User['uid'];
        actions: PostActions;
    }
    export interface State {
        newPost: Post;
    }
}

export class NewPostModalPage extends React.Component<
    NewPostModalPage.Props,
    NewPostModalPage.State
> {
    constructor(props: NewPostModalPage.Props) {
        super(props);
        this.state = {
            newPost: new Post(this.props.loggedInUser, '')
        };
        this.onInputChange = this.onInputChange.bind(this);
        this.onPlacesChanged = this.onPlacesChanged.bind(this);
        this.onSave = this.onSave.bind(this);
    }

    onInputChange(event: any) {
        const target = event.target;
        const post = this.state.newPost;
        switch (target.name) {
            case 'title':
                post.title = target.value;
                break;
            case 'description':
                post.description = target.value;
                break;
        }
        this.setState({
            newPost: post
        });
    }

    onPlacesChanged(places: google.maps.places.PlaceResult[]) {
        const post = Object.assign({}, this.state.newPost);
        post.geocode = convertPlaceResultToGeocode(places[0]);
        this.setState({
            newPost: post
        });
    }

    onSave() {
        this.props.actions.addPost(this.state.newPost);
        this.props.actions.hidePostModal();
    }

    preventCallback(event: React.MouseEvent<any>) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    render() {
        return this.props.isShowing ? (
            <div className="post-modal-container modal" onClick={this.props.actions.hidePostModal}>
                <div className="post-modal modal-dialog">
                    <div className="modal-content" onClick={this.preventCallback}>
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">
                                Add a post {this.props.loggedInUser}
                            </h5>
                            <button
                                type="button"
                                className="close"
                                data-dismiss="modal"
                                aria-label="Close"
                                onClick={this.props.actions.hidePostModal}
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="post-title">Title</label>
                                <input
                                    name="title"
                                    id="post-title"
                                    type="text"
                                    className="form-control"
                                    value={this.state.newPost.title}
                                    onChange={this.onInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="post-desc">Description</label>
                                <textarea
                                    name="description"
                                    id="post-desc"
                                    className="form-control"
                                    value={this.state.newPost.description}
                                    onChange={this.onInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="post-geocode">Address</label>
                                <SearchBox
                                    id="post-geocode"
                                    loadingElement={<div className="map-full-height" />}
                                    containerElement={<div className="map-full-height" />}
                                    mapElement={<div className="map-full-height" />}
                                    onPlacesChanged={this.onPlacesChanged}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-dismiss="modal"
                                onClick={this.props.actions.hidePostModal}
                            >
                                Close
                            </button>
                            <button type="button" className="btn btn-primary" onClick={this.onSave}>
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : null;
    }
}
