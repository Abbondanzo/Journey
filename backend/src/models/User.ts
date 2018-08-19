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
    profileDetails: { [key: string]: any };

    constructor(data: {
        uid: string;
        email: string;
        displayName: string | null;
        emailVerified?: boolean;
        password: string;
        disabled?: boolean;
        profileDetails: { [key: string]: any };
    }) {
        this.uid = data.uid;
        this.email = data.email;
        this.displayName = data.displayName || '';
        this.emailVerified = data.emailVerified;
        this.password = data.password;
        this.disabled = data.disabled;
        this.profileDetails = data.profileDetails || {};
    }
}

export interface UserExtended {
    profileDetails: { [key: string]: any };
}
