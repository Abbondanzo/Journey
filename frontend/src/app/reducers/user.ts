import { UserActions } from '@app/actions';
import { User } from '@app/models';
import { Action, handleActions } from 'redux-actions';

export interface UserState {
    users: User[];
    loggedInUser?: User['uid'];
    userProfileImages: Map<string, string>;
}

export const initialState: UserState = {
    users: [],
    userProfileImages: new Map()
};

export const userReducer = handleActions<UserState, any>(
    {
        [UserActions.Type.SAVE_AUTH_USER]: (
            state: UserState,
            action: Action<User['uid']>
        ): UserState => {
            return {
                ...state,
                loggedInUser: action.payload
            };
        },
        [UserActions.Type.LOG_OUT]: (state: UserState, _: Action<void>): UserState => {
            return {
                ...state,
                loggedInUser: undefined
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

export const getUserById = (userId: string | undefined, state: UserState): User | undefined => {
    return state.users.filter((user) => {
        return user.uid === userId;
    })[0];
};
