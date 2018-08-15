/// <reference types="@types/googlemaps" />
import { Omit } from 'lodash';

export default class Post {
    id: string;
    // owner: User;
    title: string;
    description: string;
    // images: Image;
    // likes: User[];
    geocode?: Geocode;

    constructor(data: {
        id: string;
        // owner: User;
        title: string;
        description: string;
        // images: Image;
        // likes: User[];
        geocode?: Geocode;
    }) {
        this.id = data.id;
        // this.owner = data.owner
        this.title = data.title;
        this.description = data.description;
        // this.images = data.images
        // this.likes = data.likes
        this.geocode = data.geocode;
    }
}

interface Geocode extends Omit<google.maps.places.PlaceResult, 'geometry'> {
    coordinates: google.maps.LatLngLiteral;
}
