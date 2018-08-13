import { PostActions } from '@app/actions';
import { AppState } from '@app/reducers';
import { initialState as initialPostState, PostState } from '@app/reducers/post';
// import { initialState as initialUserState, UserState } from '@app/reducers/user';
import * as firebase from 'firebase';

const FIREBASE_POSTS = process.env.NODE_ENV === 'production' ? '/post-state' : '/dev/post-state';
// const FIREBASE_USERS = process.env.NODE_ENV === 'production' ? '/users' : '/dev/users';

export default class FirebaseApp {
    private static instance: FirebaseApp;
    public firebaseApp?: firebase.app.App;
    public firebaseDataManager: FirebaseManager;
    private actionQueue: ((app: firebase.app.App) => void)[];

    private constructor() {
        this.firebaseApp = undefined;
        this.actionQueue = [];
        this.firebaseDataManager = FirebaseManager.getInstance();
        this.initialize();
    }

    public static get Instance() {
        return this.instance || (this.instance = new this());
    }

    public addActionToQueue(action: (app: firebase.app.App) => void) {
        if (this.firebaseApp) {
            action(this.firebaseApp);
        } else {
            this.actionQueue.push(action);
        }
    }

    private initialize() {
        try {
            // If we import firebase, check that we use the correct initialization
            let firebaseInit = firebase;
            if ((firebase as any).default) {
                firebaseInit = (firebase as any).default;
            }

            // One way or another, we need to initialize the app
            let init = () => {
                let app = firebaseInit.initializeApp({
                    apiKey: process.env.FIREBASE_API,
                    authDomain: 'journey-a2a8f.firebaseapp.com',
                    databaseURL: 'https://journey-a2a8f.firebaseio.com',
                    projectId: 'journey-a2a8f',
                    storageBucket: 'journey-a2a8f.appspot.com'
                });
                this.firebaseApp = app;
                this.firebaseDataManager.setDatabase(this.firebaseApp.database());
                this.actionQueue.map((action) => {
                    action(app);
                });
            };

            // Check if we have already initialized a firebase app. If so, delete it
            if (firebaseInit.apps && firebaseInit.apps.length) {
                firebaseInit
                    .app()
                    .delete()
                    .then(init);
            } else {
                init();
            }
        } catch (error) {
            console.log(error);
        }
    }
}

export class FirebaseManager {
    static instance: FirebaseManager | null = null;
    private store: any;
    private database?: firebase.database.Database;
    // We use these to check for changes against the store
    private postState: PostState = initialPostState;
    // private userState: UserState = initialUserState;

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
        this.store.subscribe(() => {
            let state: AppState = this.store.getState();
            // These will succeed and send the first time there is a valid database
            this.storePostsState(state.posts);
            // this.storeUserState(state.users);
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

        // const userStateGetter = this.getUserState();
        // if (userStateGetter) {
        //     userStateGetter.on('value', (snapshot: firebase.database.DataSnapshot | null) => {
        //         let newUserState: UserState = snapshot ? snapshot.val() : undefined;
        //         if (newUserState) {
        //             this.store.dispatch(UserActions.firebaseUser(newUserState));
        //         }
        //     });
        // }
    }

    getPostsState(): firebase.database.Reference | null {
        if (this.database) {
            return this.database.ref(FIREBASE_POSTS);
        }
        return null;
    }

    storePostsState(state: PostState) {
        if (this.database && state != this.postState) {
            this.postState = state;
            this.database.ref(FIREBASE_POSTS).set(state);
        }
    }

    /**
     * Returns a reference to the users Firebase storage. Can be used for live updates.
     * @returns [firebase.database.Reference | null]
     */
    // getUserState(): firebase.database.Reference | null {
    //     if (this.database) {
    //         return this.database.ref(FIREBASE_USERS);
    //     }
    //     return null;
    // }

    /**
     * Sets user state inside Firebase.
     * @param state {UserState}
     */
    // storeUserState(state: UserState) {
    //     if (this.database && state != this.userState) {
    //         this.userState = state;
    //         this.database.ref(FIREBASE_USERS).set(state);
    //     }
    // }
}
