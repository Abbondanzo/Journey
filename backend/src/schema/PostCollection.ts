import { firestoreInstance } from '../controllers/helper';
import Post from '../models/Post';

export default class PostCollection {
    private static POST_COLLECTION = '/posts';
    static createPost(post: Post) {
        return firestoreInstance.collection(this.POST_COLLECTION).add(post);
    }
}

export interface PostDocument extends firebase.firestore.DocumentData, Post {}
