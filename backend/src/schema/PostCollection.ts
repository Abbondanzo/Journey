import * as admin from 'firebase-admin';
import { firestoreInstance } from '../controllers/helper';
import { getPostFromData, Post } from '../models/Post';

export default class PostCollection {
    private static POST_COLLECTION = '/posts';
    static createPost(post: Post) {
        return firestoreInstance
            .collection(this.POST_COLLECTION)
            .add(post)
            .then((reference) => {
                return reference.get();
            })
            .then((snapshot) => {
                return convertDocumentToModel(snapshot);
            });
    }
    static deletePost(postId: Post['id']) {
        return firestoreInstance
            .collection(this.POST_COLLECTION)
            .where('id', '==', postId)
            .get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    doc.ref.delete();
                });
            });
    }
    static getPostById(postId: Post['id']) {
        return firestoreInstance
            .collection(this.POST_COLLECTION)
            .where('id', '==', postId)
            .limit(1)
            .get()
            .then((snapshot) => {
                return convertDocumentToModel(snapshot.docs[0]);
            });
    }
    static getPosts() {
        return firestoreInstance
            .collection(this.POST_COLLECTION)
            .get()
            .then((snapshot) => {
                const docs: Post[] = [];
                for (const doc of snapshot.docs) {
                    docs.push(convertDocumentToModel(doc));
                }
                return docs;
            });
    }
}

export interface PostDocument extends firebase.firestore.DocumentData, Post {}

const convertDocumentToModel = (document: admin.firestore.DocumentData) => {
    const data = document.data();
    return getPostFromData(data);
};
