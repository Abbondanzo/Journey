import { User, UserRole } from '@app/models';
import { createAction } from 'redux-actions';

export namespace UserActions {
    export enum Type {
        LOAD_USER = 'LOAD_USER',
        LOAD_ALL_USERS = 'LOAD_ALL_USERS',
        SAVE_USER = 'SAVE_USER',
        SAVE_ALL_USERS = 'SAVE_ALL_USERS',
        SAVE_PROFILE_IMAGE = 'SAVE_PROFILE_IMAGE',
        CREATE_USER = 'CREATE_USER',
        DELETE_USER = 'DELETE_USER',
        UPDATE_USER = 'UPDATE_USER',
        UPLOAD_PROFILE_IMAGE = 'UPLOAD_PROFILE_IMAGE',
        LOAD_AUTH_USER = 'LOAD_AUTH_USER',
        SAVE_AUTH_USER = 'SAVE_AUTH_USER',
        SIGN_IN = 'SIGN_IN',
        REGISTER_USER = 'REGISTER_USER',
        LOG_OUT = 'LOG_OUT',
        FOLLOW_USER = 'FOLLOW_USER',
        UNFOLLOW_USER = 'UNFOLLOW_USER'
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
    export const loadAllUsers = createAction<() => void | undefined>(Type.LOAD_ALL_USERS);
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
    export const getLoggedInUser = createAction<() => void | undefined>(Type.LOAD_AUTH_USER);
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
    export const register = createAction<{ username: string; email: string; password: string }>(
        Type.REGISTER_USER
    );
    /**
     * Logs the current user out from the auth service.
     */
    export const logOut = createAction(Type.LOG_OUT);
    /**
     * Updates the user with a new profile image that gets sent to the storage bucket.
     */
    export const uploadProfileImage = createAction<File>(Type.UPLOAD_PROFILE_IMAGE);
    /**
     * Creates a new user with set credentials. Meant for administrators.
     */
    export const createUser = createAction<{
        displayName: string;
        email: string;
        password: string;
        role: UserRole;
    }>(Type.CREATE_USER);
    /**
     * Removes a user by its given ID from both authorization and firestore.
     */
    export const deleteUser = createAction<User['uid']>(Type.DELETE_USER);
    /**
     * Tells the firestore to update the given user.
     */
    export const updateUser = createAction<User>(Type.UPDATE_USER);
    /**
     * The follower user follows the following user.
     */
    export const followUser = createAction<{ follower: User['uid']; following: User['uid'] }>(
        Type.FOLLOW_USER
    );
    /**
     * The follower user unfollows the following user.
     */
    export const unfollowUser = createAction<{ follower: User['uid']; following: User['uid'] }>(
        Type.UNFOLLOW_USER
    );
}

export type UserActions = Omit<typeof UserActions, 'Type'>;
