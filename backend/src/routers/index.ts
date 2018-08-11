import PostController from '../controllers/PostController';
import express from 'express';

export default class Router {
    private postController: PostController;
    constructor(private app: express.Express, private firestore: FirebaseFirestore.Firestore) {
        this.postController = new PostController(firestore);
        this.setPostMethods();
    }

    private setPostMethods() {
        this.app.route('/api/post').post(this.postController.createPost);
    }
}
