/// <reference types="@types/googlemaps" />

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
