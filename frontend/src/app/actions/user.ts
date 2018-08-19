import { User } from '@app/models';
import { createAction } from 'redux-actions';

export namespace UserActions {
    export enum Type {
        LOAD_USER = 'LOAD_USER',
        LOAD_ALL_USERS = 'LOAD_ALL_USERS',
        SAVE_USER = 'SAVE_USER',
        SAVE_ALL_USERS = 'SAVE_ALL_USERS',
        SAVE_PROFILE_IMAGE = 'SAVE_PROFILE_IMAGE',
        LOAD_AUTH_USER = 'LOAD_AUTH_USER',
        SAVE_AUTH_USER = 'SAVE_AUTH_USER',
        SIGN_IN = 'SIGN_IN',
        REGISTER_USER = 'REGISTER_USER',
        LOG_OUT = 'LOG_OUT'
    }
    /**
     * ================================
     * Actions for any user
     * ================================
     */

    /**
     * Loads profile details of the given user's ID. If the user already exists on the list, they
     * are updated. If they do not exist, no details are saved.
     */
    export const loadUser = createAction<User['uid']>(Type.LOAD_USER);
    /**
     * Loads profile details of every user stored in the database.
     */
    export const loadAllUsers = createAction(Type.LOAD_ALL_USERS);
    /**
     * Saves the user's profile details.
     */
    export const saveUser = createAction<User>(Type.SAVE_USER);
    /**
     * Overwrites the existing user list with this new list of users.
     */
    export const saveAllUsers = createAction<User[]>(Type.SAVE_ALL_USERS);
    /**
     * Associates the given url with a user ID in the profile image container.
     */
    export const saveProfileImage = createAction<{ userId: string; url: string }>(
        Type.SAVE_PROFILE_IMAGE
    );

    /**
     * ================================
     * Actions for the user who logs in
     * ================================
     */

    /**
     * Attempts to load a user that has been authorized by the authorization service.
     */
    export const getLoggedInUser = createAction(Type.LOAD_AUTH_USER);
    /**
     * Uses the given user ID and sets the logged in user.
     */
    export const setLoggedInUser = createAction<User['uid'] | undefined>(Type.SAVE_AUTH_USER);
    /**
     * Attempts to sign in to a user with the given email and password credentials.
     */
    export const signIn = createAction<{ email: string; password: string }>(Type.SIGN_IN);
    /**
     * Creates a new user with the given email and password credentials.
     */
    export const register = createAction<{ email: string; password: string }>(Type.REGISTER_USER);
    /**
     * Logs the current user out from the auth service.
     */
    export const logOut = createAction(Type.LOG_OUT);
}

export type UserActions = Omit<typeof UserActions, 'Type'>;
