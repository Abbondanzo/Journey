import { UserState } from '@app/reducers/user';
import { createAction } from 'redux-actions';

export namespace UserActions {
    export enum Type {
        SIGN_IN = 'SIGN_IN',
        FIREBASE_USER = 'FIREBASE_USER'
    }

    export const signIn = createAction<{ email: string; password: string }>(Type.SIGN_IN);
    export const firebaseUser = createAction<UserState>(Type.FIREBASE_USER);
}

export type UserActions = Omit<typeof UserActions, 'Type'>;
