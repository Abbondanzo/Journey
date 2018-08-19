export * from './logger';
export * from './user';

import { PostActions, UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import { Middleware } from 'redux';

export const loader: Middleware = (store) => (next) => (action) => {
    if (action.type === UtilActions.Type.LOAD_APP) {
        next(UserActions.getLoggedInUser());
        next(UserActions.loadAllUsers());
        next(PostActions.loadAllPosts());
        // next(
        //     UtilActions.setBounds(
        //         new google.maps.LatLngBounds({ lat: -71.2, lng: 42.2 }, { lat: -70.9, lng: 42.5 })
        //     )
        // );
        return 'Done';
    } else {
        return next(action);
    }
};
