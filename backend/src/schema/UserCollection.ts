import * as admin from 'firebase-admin';
import { firestoreInstance } from '../controllers/helper';
import User from '../models/User';

export default class UserCollection {
    private static USER_COLLECTION = '/users';
    static createUser(user: User) {
        return firestoreInstance
            .collection(this.USER_COLLECTION)
            .add(convertModelToDocument(user))
            .then((reference) => {
                return reference.get();
            })
            .then((snapshot) => {
                return convertDocumentToModel(snapshot);
            });
    }
    static findAllUsers() {
        return firestoreInstance
            .collection(this.USER_COLLECTION)
            .get()
            .then((snapshot: admin.firestore.QuerySnapshot) => {
                const docs: User[] = [];
                for (const doc of snapshot.docs) {
                    docs.push(convertDocumentToModel(doc));
                }
                return docs;
            });
    }
    static findUserById(id: string) {
        return firestoreInstance
            .collection(this.USER_COLLECTION)
            .where('userId', '==', id)
            .limit(1)
            .get()
            .then((snapshot: admin.firestore.QuerySnapshot) => {
                return convertDocumentToModel(snapshot.docs[0]);
            });
    }
    static updateUserById(id: string, user: User) {
        return firestoreInstance
            .collection(this.USER_COLLECTION)
            .where('userId', '==', id)
            .limit(1)
            .get()
            .then((snapshot) => {
                const doc = snapshot.docs[0];
                return doc.ref.set(convertModelToDocument(user));
            })
            .then(() => {
                return user;
            });
    }

    static deleteUserById(userId: string) {
        return firestoreInstance
            .collection(this.USER_COLLECTION)
            .where('userId', '==', userId)
            .get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    doc.ref.delete();
                });
            });
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

const convertDocumentToModel = (document: admin.firestore.DocumentData) => {
    const data = document.data();
    const profileDetails = {
        following: []
    };
    for (const key of Object.keys(data)) {
        if (key !== 'userId') {
            profileDetails[key] = data[key];
        }
    }
    const userStructure: Partial<User> = {
        uid: data.userId,
        profileDetails
    };
    return new User(userStructure as any);
};
