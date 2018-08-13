import { UserActions } from '@app/actions';
import User, { LoggedInUser } from '@app/models/User';
import { Action, handleActions } from 'redux-actions';

export interface UserState {
    users: User[];
    loggedInUser?: LoggedInUser;
}

export const initialState: UserState = {
    users: []
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
        [UserActions.Type.SAVE_USER]: (
            state: UserState,
            action: Action<LoggedInUser>
        ): UserState => {
            return {
                ...state,
                loggedInUser: action.payload
            };
        }
    },
    initialState
);
