import * as express from 'express';
import * as admin from 'firebase-admin';
import PostController from '../controllers/PostController';

export default class Router {
    private postController: PostController;
    constructor(
        private app: express.Express,
        private firestore: FirebaseFirestore.Firestore,
        private auth: admin.auth.Auth
    ) {
        this.postController = new PostController(firestore);
        this.setPostMethods();
    }

    private setPostMethods() {
        this.app.route('/post').post(this.postController.createPost);
    }
}
