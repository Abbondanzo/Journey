import Post from '@app/models/Post';
import { PostState } from '@app/reducers/post';
import { createAction } from 'redux-actions';

export namespace PostActions {
    export enum Type {
        SELECT_POST = 'SELECT_POST',
        ADD_POST = 'ADD_POST',
        DELETE_POST = 'DELETE_POST',
        FIREBASE_POST = 'FIREBASE_POST'
    }

    export const selectPost = createAction<Post['id']>(Type.SELECT_POST);
    export const addPost = createAction<Post>(Type.ADD_POST);
    export const deletePost = createAction<Post['id']>(Type.DELETE_POST);
    export const firebasePost = createAction<PostState>(Type.FIREBASE_POST);
}

export type PostActions = Omit<typeof PostActions, 'Type'>;
