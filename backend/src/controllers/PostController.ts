import * as functions from 'firebase-functions';

import Post, { PostDocument } from '../models/Post';

import { handleError } from './helper';

export default class PostController {
    private POST_COL = 'posts';
    constructor(private firestore: FirebaseFirestore.Firestore) {}

    async createPost(req: functions.Request, res: functions.Response) {
        const post: PostDocument = new Post(req.body);
        this.firestore
            .collection(this.POST_COL)
            .add(post)
            .then((postDoc) => {
                res.send(postDoc);
            })
            .catch(handleError('Unable to create post', res));
    }
}
