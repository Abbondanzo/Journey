import User, { LoggedInUser } from '@app/models/User';
import { handleActions } from 'redux-actions';

export interface UserState {
    users: User[];
    loggedInUser?: LoggedInUser;
}

const initialState: UserState = {
    users: []
};

export const userReducer = handleActions<UserState, any>({}, initialState);
