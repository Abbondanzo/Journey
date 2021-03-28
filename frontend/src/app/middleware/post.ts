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
        case PostActions.Type.DELETE_POST:
            postService
                .deletePost(action.payload)
                .then(() => {
                    next(PostActions.deletePost(action.payload));
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to delete post: ${err.message || err}`));
                });
            break;
        case PostActions.Type.LOAD_ALL_POSTS:
            postService
                .getAllPosts()
                .then((posts) => {
                    next(PostActions.saveAllPosts(posts));
                    // Resolve
                    if (action.payload) {
                        action.payload();
                    }
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to load posts: ${err.message || err}`));
                    // Resolve
                    if (action.payload) {
                        action.payload();
                    }
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
                .catch(this.rejectForbiddenError(reject));
        });
    }

    deletePost(postId: string) {
        return new Promise((resolve: () => void, reject: any) => {
            FirebaseApp.Instance.getBearerToken()
                .then((bearerToken) => {
                    return axios({
                        ...this.baseConfig,
                        method: 'delete',
                        url: `/api/post/${postId}`,
                        headers: { Authorization: bearerToken, 'Content-Type': 'application/json' }
                    });
                })
                .then(resolve)
                .catch(this.rejectForbiddenError(reject));
        });
    }

    getAllPosts() {
        return new Promise((resolve: (posts: Post[]) => void, reject: any) => {
            axios({
                ...this.baseConfig,
                method: 'get',
                url: `/api/post`
            })
                .then(this.resolvePosts(resolve))
                .catch(this.rejectForbiddenError(reject));
        });
    }

    private rejectForbiddenError(reject: any) {
        return (err: any) => {
            if (err.response) {
                const data = err.response.data;
                reject(data.error || data.message || data);
            } else {
                reject(err);
            }
        };
    }

    private resolvePost(resolve: (post: Post) => void) {
        return (response: AxiosResponse<any>) => {
            const newPost = Object.assign({}, new Post('', ''), response.data);
            resolve(newPost);
        };
    }

    private resolvePosts(resolve: (posts: Post[]) => void) {
        return (response: AxiosResponse<any>) => {
            const posts = [];
            const postObjects = response.data || [];
            for (const postObject of postObjects) {
                const newPost = Object.assign(new Post('', ''), postObject);
                posts.push(newPost);
            }
            resolve(posts);
        };
    }
}
