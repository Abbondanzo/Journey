import { UserState } from '@app/reducers/user';
import { createAction } from 'redux-actions';

export namespace UserActions {
    export enum Type {
        SIGN_IN_WITH_USERNAME = 'SIGN_IN_WITH_USERNAME',
        FIREBASE_USER = 'FIREBASE_USER'
    }

    export const signInWithUsername = createAction<{
        username: string;
        password: string;
    }>(Type.SIGN_IN_WITH_USERNAME);
    export const firebaseUser = createAction<UserState>(Type.FIREBASE_USER);
}

export type UserActions = Omit<typeof UserActions, 'Type'>;
