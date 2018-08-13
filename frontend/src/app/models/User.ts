export default class User {
    id: string;
    displayName: string;
    following: User[] = [];

    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }

    setFields(object: any) {
        this.id = object.id;
        this.displayName = object.displayName;
        this.following = object.following;
        return this;
    }
}

export class LoggedInUser extends User {
    email: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;

    constructor(id: string, displayName: string, email: string) {
        super(id, displayName);
        this.email = email;
    }

    setFields(object: any) {
        super.setFields(object);
        this.email = object.email;
        this.firstName = object.firstName;
        this.lastName = object.lastName;
        this.dateOfBirth = object.dateOfBirth;
        return this;
    }
}
