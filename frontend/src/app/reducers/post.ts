import { PostActions } from '@app/actions';
import Post from '@app/models/Post';
import { Action, handleActions } from 'redux-actions';

export interface PostState {
    activePost?: Post['id'];
    posts: Post[];
    isAddingPost: boolean;
}

export const initialState: PostState = {
    posts: [],
    isAddingPost: false
};

export const postReducer = handleActions<PostState, any>(
    {
        [PostActions.Type.ADD_POST]: (state: PostState, action: Action<Post>): PostState => {
            const posts = [...state.posts];
            if (action.payload) {
                posts.push(action.payload);
            }
            return {
                ...state,
                posts
            };
        },
        [PostActions.Type.DELETE_POST]: (
            state: PostState,
            action: Action<Post['id']>
        ): PostState => {
            let posts = [...state.posts];
            if (action.payload) {
                posts = posts.filter((post) => {
                    return post.id !== action.payload;
                });
            }
            return {
                ...state,
                posts
            };
        },
        [PostActions.Type.SHOW_POST_MODAL]: (state: PostState, _: Action<void>): PostState => {
            return {
                ...state,
                isAddingPost: true
            };
        },
        [PostActions.Type.HIDE_POST_MODAL]: (state: PostState, _: Action<void>): PostState => {
            return {
                ...state,
                isAddingPost: false
            };
        },
        [PostActions.Type.SAVE_ALL_POSTS]: (
            state: PostState,
            action: Action<Post[]>
        ): PostState => {
            return {
                ...state,
                posts: action.payload || []
            };
        }
    },
    initialState
);
