import User from '@app/models/User';
/// <reference types="@types/googlemaps" />

export default class Post {
    id: number;
    owner: User;
    title: string;
    description: string;
    // images: Image;
    likes: User[];
    geocode?: Geocode;

    constructor(id: number, owner: User, title: string) {
        this.id = id;
        this.owner = owner;
        this.title = title;
        this.description = '';
        this.likes = [];
        this.likes.push(owner);
    }

    setFields(object: any) {
        this.id = object.id;
        this.owner = object.owner;
        this.title = object.title;
        this.description = object.description;
        this.likes = object.likes;
    }
}

interface Geocode extends Omit<google.maps.places.PlaceResult, 'geometry'> {
    coordinates: google.maps.LatLngLiteral;
}

export const convertPlaceResultToGeocode = (
    placeResult: google.maps.places.PlaceResult
): Geocode => {
    const result: any = placeResult;
    const coordinates = placeResult.geometry.location.toJSON();
    delete result.geometry;
    delete result.photos;
    (result as any).coordinates = coordinates;
    return result as Geocode;
};
