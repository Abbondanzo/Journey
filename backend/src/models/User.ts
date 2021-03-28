import * as firebase from 'firebase';
export default class User implements Partial<firebase.UserInfo>, UserExtended {
    // UserInfo
    uid: string;
    email: string;
    displayName: string | null;
    // Firebase Auth details
    emailVerified?: boolean;
    password: string;
    disabled?: boolean;
    // Custom data
    profileDetails: {
        following: User['uid'][];
        profileImage?: string;
        role?: UserRole;
        [key: string]: any;
    };

    constructor(data: {
        uid: string;
        email: string;
        displayName: string | null;
        emailVerified?: boolean;
        password: string;
        disabled?: boolean;
        profileDetails: {
            following: User['uid'][];
            profileImage?: string;
            role?: UserRole;
            [key: string]: any;
        };
    }) {
        this.uid = data.uid;
        this.email = data.email;
        this.displayName = data.displayName;
        this.emailVerified = data.emailVerified;
        this.password = data.password;
        this.disabled = data.disabled;
        this.profileDetails = data.profileDetails || {
            following: []
        };
        this.profileDetails.following =
            data.profileDetails && data.profileDetails.following
                ? data.profileDetails.following
                : [];
        this.profileDetails.role =
            data.profileDetails && data.profileDetails.role
                ? data.profileDetails.role
                : UserRole.USER;
    }
}

export interface UserExtended {
    profileDetails: { [key: string]: any };
}

export enum UserRole {
    USER = 'user',
    MODERATOR = 'mod',
    ADMINISTRATOR = 'admin'
}
