import { User } from '@app/models';
/// <reference types="@types/googlemaps" />

export default class Post {
    id: string;
    owner: User['uid'];
    title: string;
    description: string;
    // images: Image;
    likes: User['uid'][];
    geocode?: Geocode;

    constructor(owner: User['uid'], title: string) {
        this.id = this.guid();
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

    guid() {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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
