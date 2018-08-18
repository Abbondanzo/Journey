import { PostActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import Post from '@app/models/Post';
import FirebaseApp from '@app/utils/firebase';
import axios, { AxiosResponse } from 'axios';
import { AnyAction, Middleware } from 'redux';

export const postMiddleware: Middleware = (store) => (next) => (action: AnyAction) => {
    const postService = new PostService();
    switch (action.type) {
        case PostActions.Type.ADD_POST:
            const payload: Post = action.payload;
            postService
                .createPost(payload)
                .then((post) => {
                    next(PostActions.addPost(post));
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to create post: ${err.message || err}`));
                });
            break;
        default:
            next(action);
    }
};

class PostService {
    private baseConfig = {
        baseURL:
            process.env.NODE_ENV === 'production'
                ? 'https://us-central1-journey-a2a8f.cloudfunctions.net'
                : 'http://localhost:5000/journey-a2a8f/us-central1',
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    createPost(post: Post) {
        return new Promise((resolve: (post: Post) => void, reject: any) => {
            FirebaseApp.Instance.getBearerToken()
                .then((bearerToken) => {
                    return axios({
                        ...this.baseConfig,
                        method: 'post',
                        url: `/api/post`,
                        data: post,
                        headers: { Authorization: bearerToken, 'Content-Type': 'application/json' }
                    });
                })
                .then(this.resolvePost(resolve))
                .catch(reject);
        });
    }

    private resolvePost(resolve: (post: Post) => void) {
        return (response: AxiosResponse<any>) => {
            const newPost = Object.assign({}, new Post('', ''), response.data);
            resolve(newPost);
        };
    }

    // private resolvePosts(resolve: (posts: Post[]) => void) {
    //     return (response: AxiosResponse<any>) => {
    //         const posts = [];
    //         const postObjects = response.data || [];
    //         for (const postObject of postObjects) {
    //             const newPost = Object.assign(new Post('', ''), postObject);
    //             posts.push(newPost);
    //         }
    //         resolve(posts);
    //     };
    // }
}
