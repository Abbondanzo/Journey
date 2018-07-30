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
}
