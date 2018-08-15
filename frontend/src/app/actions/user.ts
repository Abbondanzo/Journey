import { User } from '@app/models';
import { UserState } from '@app/reducers/user';
import { createAction } from 'redux-actions';

export namespace UserActions {
    export enum Type {
        LOAD_USER = 'LOAD_USER',
        SAVE_USER = 'SAVE_USER',
        SIGN_IN = 'SIGN_IN',
        LOG_OUT = 'LOG_OUT',
        SAVE_PROFILE_IMAGE = 'SAVE_PROFILE_IMAGE',
        FIREBASE_USER = 'FIREBASE_USER'
    }
    export const loadUser = createAction(Type.LOAD_USER);
    export const saveUser = createAction<User | undefined>(Type.SAVE_USER);
    export const signIn = createAction<{ email: string; password: string }>(Type.SIGN_IN);
    export const logOut = createAction(Type.LOG_OUT);
    export const saveProfileImage = createAction<{ userId: string; url: string }>(
        Type.SAVE_PROFILE_IMAGE
    );
    export const firebaseUser = createAction<UserState>(Type.FIREBASE_USER);
}

export type UserActions = Omit<typeof UserActions, 'Type'>;
