import User from '@app/models/User';

export default class Post {
    id: number;
    owner: User;
    title: string;
    description: string;
    // images: Image;
    likes: User[];
    // geocode: LatLng;

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
