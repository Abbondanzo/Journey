import * as functions from 'firebase-functions';
import { getPostFromData } from '../models/Post';
import PostCollection from '../schema/PostCollection';
import { handleCatchError, PermissionsManager } from './helper';

export default class PostController {
    static async createPost(req: functions.Request, res: functions.Response) {
        const post = getPostFromData(req.body);
        PostCollection.createPost(post)
            .then((newPost) => {
                res.send(newPost);
            })
            .catch(handleCatchError('Unable to create post', res));
    }

    static async getAllPosts(_: functions.Request, res: functions.Response) {
        PostCollection.getPosts()
            .then((posts) => {
                res.send(posts);
            })
            .catch(handleCatchError('Unable to get posts', res));
    }

    static async deletePost(req: functions.Request, res: functions.Response) {
        const postId = req.params.postId;
        Promise.all([PermissionsManager.canEditAllPosts(req), PostCollection.getPostById(postId)])
            .then((value) => {
                if (value[0] || value[1].owner === PermissionsManager.getToken(req).uid) {
                    return PostCollection.deletePost(postId);
                } else {
                    throw Error('User does not own or cannot delete this post');
                }
            })
            .then(() => {
                res.send({
                    message: 'Post deleted successfully'
                });
            })
            .catch(handleCatchError('Unable to delete post', res));
    }
}
