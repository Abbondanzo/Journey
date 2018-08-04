import Post from '@app/models/Post';
import { handleActions } from 'redux-actions';

export interface PostState {
    activePost?: Post['id'];
    posts: Post[];
}

const initialState: PostState = {
    posts: []
};

export const postReducer = handleActions<PostState, any>({}, initialState);
