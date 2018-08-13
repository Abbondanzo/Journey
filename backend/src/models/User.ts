export default class User {
    uid?: string;
    email: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    password: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;

    constructor(data: {
        uid?: string;
        email: string;
        emailVerified?: boolean;
        phoneNumber?: string;
        password: string;
        displayName?: string;
        photoURL?: string;
        disabled?: boolean;
    }) {
        this.uid = data.uid;
        this.email = data.email;
        this.emailVerified = data.emailVerified;
        this.phoneNumber = data.phoneNumber;
        this.password = data.password;
        this.displayName = data.displayName;
        this.photoURL = data.photoURL;
        this.disabled = data.disabled;
    }
}
