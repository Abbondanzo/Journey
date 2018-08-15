import { UserInfo } from 'firebase';

export class User implements UserInfo {
    // Firebase Auth
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;
    profileDetails: {
        following: User['uid'][];
        profileImage?: string;
        [key: string]: any;
    };

    constructor(data: {
        displayName: string | null;
        email: string | null;
        phoneNumber: string | null;
        photoURL: string | null;
        providerId: string;
        uid: string;
        profileDetails?: {
            following: User['uid'][];
            profileImage?: string;
            [key: string]: any;
        };
    }) {
        this.displayName = data.displayName;
        this.email = data.email;
        this.phoneNumber = data.phoneNumber;
        this.photoURL = data.photoURL;
        this.providerId = data.providerId;
        this.uid = data.uid;
        this.displayName = data.displayName;
        this.profileDetails = data.profileDetails || {
            following: []
        };
        this.profileDetails.following =
            data.profileDetails && data.profileDetails.following
                ? data.profileDetails.following
                : [];
    }
}
