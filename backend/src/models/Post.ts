/// <reference types="@types/googlemaps" />
import { Omit } from 'lodash';
import User from './User';

export interface Post {
    id: string;
    owner: User['uid'];
    title: string;
    description: string;
    // images: Image;
    likes: User['uid'][];
    geocode?: Geocode;
}

export const getPostFromData = (data: {
    id: string;
    owner: User['uid'];
    title: string;
    description: string;
    // images: Image;
    likes: User['uid'][];
    geocode?: Geocode;
}) => {
    const post: Post = {
        id: '',
        owner: '',
        title: '',
        description: '',
        likes: []
    };
    return Object.assign(post, data) as Post;
};

interface Geocode extends Omit<google.maps.places.PlaceResult, 'geometry'> {
    coordinates: google.maps.LatLngLiteral;
}
