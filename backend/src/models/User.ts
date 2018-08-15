import * as firebase from 'firebase';
export default class User implements firebase.UserInfo, UserExtended {
    // UserInfo
    uid: string;
    email: string;
    displayName: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
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
        phoneNumber: string | null;
        photoURL: string | null;
        providerId: string;
        emailVerified?: boolean;
        password: string;
        disabled?: boolean;
        profileDetails: { [key: string]: any };
    }) {
        this.uid = data.uid;
        this.email = data.email;
        this.displayName = data.displayName;
        this.phoneNumber = data.phoneNumber;
        this.photoURL = data.photoURL;
        this.providerId = data.providerId;
        this.emailVerified = data.emailVerified;
        this.password = data.password;
        this.disabled = data.disabled;
        this.profileDetails = data.profileDetails;
    }
}

export interface UserExtended {
    profileDetails: { [key: string]: any };
}
