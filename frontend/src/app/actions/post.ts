import Post from '@app/models/Post';
import { createAction } from 'redux-actions';

export namespace PostActions {
    export enum Type {
        // Operations on a single post
        SELECT_POST = 'SELECT_POST',
        ADD_POST = 'ADD_POST',
        DELETE_POST = 'DELETE_POST',
        // Post modal
        SHOW_POST_MODAL = 'SHOW_POST_MODAL',
        HIDE_POST_MODAL = 'HIDE_POST_MODAL',
        // Utils
        LOAD_ALL_POSTS = 'LOAD_ALL_POSTS',
        SAVE_ALL_POSTS = 'SAVE_ALL_POSTS'
    }

    export const selectPost = createAction<Post['id']>(Type.SELECT_POST);
    export const addPost = createAction<Post>(Type.ADD_POST);
    export const deletePost = createAction<Post['id']>(Type.DELETE_POST);
    export const showPostModal = createAction(Type.SHOW_POST_MODAL);
    export const hidePostModal = createAction(Type.HIDE_POST_MODAL);
    export const loadAllPosts = createAction(Type.LOAD_ALL_POSTS);
    export const saveAllPosts = createAction<Post[]>(Type.SAVE_ALL_POSTS);
}

export type PostActions = Omit<typeof PostActions, 'Type'>;
