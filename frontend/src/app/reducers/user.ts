import { Action, handleActions } from 'redux-actions';

import { User } from '@app/models';
import { UserActions } from '@app/actions';

export interface UserState {
    users: User[];
    loggedInUser?: User;
    userProfileImages: Map<string, string>;
}

export const initialState: UserState = {
    users: [],
    userProfileImages: new Map()
};

export const userReducer = handleActions<UserState, any>(
    {
        [UserActions.Type.FIREBASE_USER]: (
            state: UserState,
            action: Action<UserState>
        ): UserState => {
            if (action.payload) {
                return {
                    ...action.payload
                };
            }
            return {
                ...state
            };
        },
        [UserActions.Type.SAVE_USER]: (state: UserState, action: Action<User>): UserState => {
            return {
                ...state,
                loggedInUser: action.payload
            };
        },
        [UserActions.Type.SAVE_PROFILE_IMAGE]: (
            state: UserState,
            action: Action<{ userId: string; url: string }>
        ): UserState => {
            const userProfileImages = state.userProfileImages;
            if (action.payload) {
                userProfileImages.set(action.payload.userId, action.payload.url);
            }
            return {
                ...state,
                userProfileImages
            };
        }
    },
    initialState
);
