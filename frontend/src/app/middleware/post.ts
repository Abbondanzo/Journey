import { PostActions } from '@app/actions';
import Post from '@app/models/Post';
import { AnyAction, Middleware } from 'redux';

export const postMiddleware: Middleware = (store) => (next) => (action: AnyAction) => {
    switch (action.type) {
        case PostActions.Type.ADD_POST:
            const payload: Post = action.payload;
            console.log(payload);
            break;
        default:
            next(action);
    }
};
