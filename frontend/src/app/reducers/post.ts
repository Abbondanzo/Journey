import { PostActions } from '@app/actions';
import Post from '@app/models/Post';
import { Action, handleActions } from 'redux-actions';

export interface PostState {
    activePost?: Post['id'];
    posts: Post[];
}

const initialState: PostState = {
    posts: []
};

export const postReducer = handleActions<PostState, any>(
    {
        [PostActions.Type.ADD_POST]: (state: PostState, action: Action<Post>): PostState => {
            const posts = state.posts;
            if (action.payload) {
                posts.push(action.payload);
            }
            return {
                ...state,
                posts
            };
        }
    },
    initialState
);
