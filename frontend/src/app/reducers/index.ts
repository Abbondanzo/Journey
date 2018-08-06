import FirebaseApp from '@app/middleware/firebase';
import { postReducer, PostState } from '@app/reducers/post';
import { userReducer, UserState } from '@app/reducers/user';
import { utilReducer, UtilState } from '@app/reducers/util';
import { routerReducer, RouterState } from 'react-router-redux';
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

export const firebaseApp = FirebaseApp.Instance;
