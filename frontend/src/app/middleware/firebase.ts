import FirebaseManager from '@app/utils/firebase';
import * as firebase from 'firebase';

export default class FirebaseApp {
    private static instance: FirebaseApp;
    public firebaseApp?: firebase.app.App;
    public firebaseDataManager: FirebaseManager;

    private constructor() {
        this.firebaseApp = undefined;
        this.firebaseDataManager = FirebaseManager.getInstance();
        this.initialize();
    }

    public static get Instance() {
        return this.instance || (this.instance = new this());
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
                this.firebaseApp = firebaseInit.initializeApp({
                    apiKey: process.env.FIREBASE_API,
                    authDomain: 'journey-a2a8f.firebaseapp.com',
                    databaseURL: 'https://journey-a2a8f.firebaseio.com',
                    projectId: 'journey-a2a8f',
                    storageBucket: 'journey-a2a8f.appspot.com'
                });
                this.firebaseDataManager.setDatabase(this.firebaseApp.database());
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
