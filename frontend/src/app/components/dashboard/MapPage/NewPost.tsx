import SearchBox from '@app/containers/dashboard/SearchBox';
import Post, { convertPlaceResultToGeocode } from '@app/models/Post';
import * as React from 'react';
import './style.scss';

export namespace NewPost {
    export interface Props {
        onSave(post: Post): void;
        onClose(): void;
    }
    export interface State {
        newPost: Post;
    }
}

export class NewPost extends React.Component<NewPost.Props, NewPost.State> {
    constructor(props: NewPost.Props) {
        super(props);
        // TODO: Fix this user reference to be the logged in user
        this.state = {
            newPost: new Post('0', '')
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
        const post = this.state.newPost;
        post.geocode = convertPlaceResultToGeocode(places[0]);
        this.setState({
            newPost: post
        });
    }

    onSave() {
        this.props.onSave(this.state.newPost);
        this.props.onClose();
    }

    stopEventPropagation(event: React.MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
    }

    render() {
        return (
            <div className="modal" onClick={this.props.onClose}>
                <div className="modal-dialog" role="document" onClick={this.stopEventPropagation}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="exampleModalLabel">
                                Add a post
                            </h5>
                            <button
                                type="button"
                                className="close"
                                data-dismiss="modal"
                                aria-label="Close"
                                onClick={this.props.onClose}
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
                                onClick={this.props.onClose}
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
        );
    }
}
