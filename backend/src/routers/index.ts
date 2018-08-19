import * as express from 'express';
import { firebaseIdToken } from '../controllers/helper';
import PostController from '../controllers/PostController';
import UserController from '../controllers/UserController';

export default class Router {
    constructor(private app: express.Express) {
        this.setPostMethods();
        this.setUserMethods();
    }

    private setPostMethods() {
        this.app
            .route('/post')
            .post(firebaseIdToken, PostController.createPost)
            .get(PostController.getAllPosts);
        this.app.route('/post/:postId').delete(firebaseIdToken, PostController.deletePost);
    }

    private setUserMethods() {
        this.app.route('/register').post(UserController.register);
        this.app.route('/user').get(UserController.getAllUsers);
        this.app.route('/user/:userId').get(UserController.getUserById);
    }
}
