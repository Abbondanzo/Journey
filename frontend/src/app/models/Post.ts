import User from '@app/models/User';

export default class Post {
    id: number;
    owner: User;
    description: string;
    // images: Image;
    likes: User[];
    // geocode: LatLng;

    constructor(id: number, owner: User) {
        this.id = id;
        this.owner = owner;
        this.description = '';
        this.likes = [];
        this.likes.push(owner);
    }

    setFields(object: any) {
        this.id = object.id;
        this.owner = object.owner;
        this.description = object.description;
        this.likes = object.likes;
    }
}
