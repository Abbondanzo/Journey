export default class User {
    id: number;
    displayName: string;
    following: User[] = [];

    constructor(id: number, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }
}

export class LoggedInUser extends User {
    email: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;

    constructor(id: number, displayName: string, email: string) {
        super(id, displayName);
        this.email = email;
    }
}
