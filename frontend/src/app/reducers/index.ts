import { PostState, postReducer } from '@app/reducers/post';
import { RouterState, routerReducer } from 'react-router-redux';
import { UserState, userReducer } from '@app/reducers/user';
import { UtilState, utilReducer } from '@app/reducers/util';

import { combineReducers } from 'redux';

export interface AppState {
    users: UserState;
    posts: PostState;
    utils: UtilState;
    router: RouterState;
}

export const rootReducer = combineReducers<AppState>({
    users: userReducer as any,
    posts: postReducer as any,
    utils: utilReducer as any,
    router: routerReducer as any
});
