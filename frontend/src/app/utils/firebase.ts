import * as firebase from 'firebase';

import { PostActions, UserActions } from '@app/actions';

import { AppState } from '@app/reducers';
import { PostState } from '@app/reducers/post';
import { UserState } from '@app/reducers/user';

const FIREBASE_POSTS = '/postState';
const FIREBASE_USERS = '/users';

export default class FirebaseManager {
    static instance: FirebaseManager | null = null;
    private store: any;
    private database?: firebase.database.Database;

    /**
     * Firebase database singleton. Creates a firebase manager if there is none or returns the
     * static instance.
     * @returns {FirebaseManager}
     */
    static getInstance(): FirebaseManager {
        if (FirebaseManager.instance == null) {
            FirebaseManager.instance = new FirebaseManager();
        }

        return FirebaseManager.instance;
    }

    /**
     * Gets a reference to the Firebase database.
     * @returns {firebase.database.Database}
     */
    getDatabase(): firebase.database.Database | undefined {
        return this.database;
    }

    /**
     * Sets a new Firebase database instance.
     * @param database {firebase.database.Database}
     */
    setDatabase(database: firebase.database.Database) {
        this.database = database;
    }

    /**
     * Subscribes to changes of the global store in order to store specific states.
     */
    subscribeToStore(store: any) {
        this.store = store;
        console.log(store, require('../store'));
        this.store.subscribe(() => {
            let state: AppState = this.store.getState();
            // These will succeed and send the first time there is a valid database
            console.log('store update');
            this.storePostsState(state.posts);
            this.storeUserState(state.users);
        });
        this.subscribeToFirebase();
    }

    /**
     * Subscribes to changes from the Firebase database references to update specific states.
     */
    subscribeToFirebase() {
        const postsStateGetter = this.getPostsState();
        if (postsStateGetter) {
            postsStateGetter.on('value', (snapshot: firebase.database.DataSnapshot | null) => {
                const newItemState: PostState = snapshot ? snapshot.val() : undefined;
                if (snapshot) {
                    this.store.dispatch(PostActions.firebasePost(newItemState));
                }
            });
        }

        const userStateGetter = this.getUserState();
        if (userStateGetter) {
            userStateGetter.on('value', (snapshot: firebase.database.DataSnapshot | null) => {
                let newUserState: UserState = snapshot ? snapshot.val() : undefined;
                if (newUserState) {
                    this.store.dispatch(UserActions.firebaseUser(newUserState));
                }
            });
        }
    }

    getPostsState(): firebase.database.Reference | null {
        if (this.database) {
            return this.database.ref(FIREBASE_POSTS);
        }
        return null;
    }

    storePostsState(state: PostState) {
        if (this.database) {
            this.database.ref(FIREBASE_POSTS).set(state);
        }
    }

    /**
     * Returns a reference to the users Firebase storage. Can be used for live updates.
     * @returns [firebase.database.Reference | null]
     */
    getUserState(): firebase.database.Reference | null {
        if (this.database) {
            return this.database.ref(FIREBASE_USERS);
        }
        return null;
    }

    /**
     * Sets user state inside Firebase.
     * @param state {UserState}
     */
    storeUserState(state: UserState) {
        if (this.database) {
            this.database.ref(FIREBASE_USERS).set(state);
        }
    }
}
