import { createAction } from 'redux-actions';

export namespace UserActions {
    export enum Type {
        SIGN_IN_WITH_USERNAME = 'SIGN_IN_WITH_USERNAME'
    }

    export const signInWithUsername = createAction<{
        username: string;
        password: string;
    }>(Type.SIGN_IN_WITH_USERNAME);
}

export type UserActions = Omit<typeof UserActions, 'Type'>;
