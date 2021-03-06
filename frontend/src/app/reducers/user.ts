import { UserActions } from '@app/actions';
import { User, UserRole } from '@app/models';
import Post from '@app/models/Post';
import { Action, handleActions } from 'redux-actions';

export interface UserState {
    users: Map<User['uid'], User>;
    loggedInUser?: User['uid'];
    userProfileImages: Map<string, string>;
}

export const initialState: UserState = {
    users: new Map(),
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
            const userProfileImages = new Map(state.userProfileImages);
            if (action.payload) {
                userProfileImages.set(action.payload.userId, action.payload.url);
            }
            return {
                ...state,
                userProfileImages
            };
        },
        [UserActions.Type.SAVE_USER]: (state: UserState, action: Action<User>): UserState => {
            const userMap = state.users;
            if (action.payload) {
                userMap.set(action.payload.uid, action.payload);
            }
            return {
                ...state,
                users: userMap
            };
        },
        [UserActions.Type.SAVE_ALL_USERS]: (
            state: UserState,
            action: Action<User[]>
        ): UserState => {
            const userMap: Map<string, User> = new Map();
            for (const user of action.payload || []) {
                userMap.set(user.uid, user);
            }
            return {
                ...state,
                users: userMap
            };
        },
        [UserActions.Type.DELETE_USER]: (
            state: UserState,
            action: Action<User['uid']>
        ): UserState => {
            const userMap = state.users;
            if (action.payload) {
                userMap.delete(action.payload);
            }
            return {
                ...state,
                users: userMap
            };
        }
    },
    initialState
);

export const getUserById = (userId: string | undefined, state: UserState): User | undefined => {
    return userId ? state.users.get(userId) : undefined;
};

export class PermissionsManager {
    static canDeletePost(state: UserState, userId: string, post: Post) {
        const user = state.users.get(userId);
        const hasAuthority =
            user &&
            (user.profileDetails.role === UserRole.MODERATOR ||
                user.profileDetails.role === UserRole.ADMINISTRATOR);
        return post.owner === userId || hasAuthority;
    }
}
