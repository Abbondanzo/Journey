import * as functions from 'firebase-functions';
import Post from '../models/Post';
import PostCollection from '../schema/PostCollection';
import { handleCatchError } from './helper';

export default class PostController {
    static async createPost(req: functions.Request, res: functions.Response) {
        const post: Post = new Post(req.body);
        PostCollection.createPost(post)
            .then((postDoc) => {
                res.send(postDoc);
            })
            .catch(handleCatchError('Unable to create post', res));
    }
}
