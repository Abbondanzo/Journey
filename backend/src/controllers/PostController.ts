import * as functions from 'firebase-functions';
import Post, { PostDocument } from '../models/Post';
import { firestoreInstance, handleCatchError } from './helper';

export default class PostController {
    private static POST_COL = 'posts';

    static async createPost(req: functions.Request, res: functions.Response) {
        const post: PostDocument = new Post(req.body);
        firestoreInstance
            .collection(this.POST_COL)
            .add(post)
            .then((postDoc) => {
                res.send(postDoc);
            })
            .catch(handleCatchError('Unable to create post', res));
    }
}
