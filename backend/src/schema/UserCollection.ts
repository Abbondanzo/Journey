import { firestoreInstance } from '../controllers/helper';
import User from '../models/User';

export default class UserCollection {
    private static USER_COLLECTION = '/users';
    static createUser(user: User) {
        return firestoreInstance.collection(this.USER_COLLECTION).add(convertModelToDocument(user));
    }
    static findUsersByIds(ids: User['uid'][]) {
        // We are effectively tossing these IDs out until we decide to store user auth data
        // separate from profile data
        return firestoreInstance.collection(this.USER_COLLECTION).get();
    }
    static findUserById(id: string) {
        return firestoreInstance
            .collection(this.USER_COLLECTION)
            .where('uid', '==', id)
            .limit(1)
            .get();
    }
}

export interface UserDocument extends firebase.firestore.DocumentData {
    userId: string;
}

const convertModelToDocument = (user: User) => {
    const userDocument: UserDocument = {
        userId: user.uid
    };
    for (const key of Object.keys(user.profileDetails)) {
        userDocument[key] = user.profileDetails[key];
    }
    return userDocument;
};
