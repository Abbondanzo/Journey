import * as functions from 'firebase-functions';
import { getPostFromData } from '../models/Post';
import PostCollection from '../schema/PostCollection';
import { handleCatchError } from './helper';

export default class PostController {
    static async createPost(req: functions.Request, res: functions.Response) {
        const post = getPostFromData(req.body);
        PostCollection.createPost(post)
            .then((postDoc) => {
                res.send(postDoc);
            })
            .catch(handleCatchError('Unable to create post', res));
    }

    static async getAllPosts(_: functions.Request, res: functions.Response) {
        PostCollection.getPosts()
            .then((postDocs) => {
                res.send(postDocs);
            })
            .catch(handleCatchError('Unable to get posts', res));
    }
}
