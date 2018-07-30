import { postReducer, PostState } from '@app/reducers/post';
import { userReducer, UserState } from '@app/reducers/user';
import { routerReducer, RouterState } from 'react-router-redux';
import { combineReducers } from 'redux';

export interface AppState {
    users: UserState;
    posts: PostState;
    router: RouterState;
}

export const rootReducer = combineReducers<AppState>({
    users: userReducer as any,
    posts: postReducer as any,
    router: routerReducer as any
});
