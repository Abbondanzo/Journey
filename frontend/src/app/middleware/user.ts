import { UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import { LoggedInUser } from '@app/models/User';
// import { AppState } from '@app/reducers';
import FirebaseApp from '@app/utils/firebase';
import { AnyAction, Dispatch, Middleware } from 'redux';

export const authMiddleware: Middleware = (store) => (next: Dispatch<AnyAction>) => (
    action: AnyAction
) => {
    // const state: AppState = store.getState();
    const instance = FirebaseApp.Instance;
    switch (action.type) {
        case UserActions.Type.LOAD_USER:
            // Sets subscriber
            const doOnAppLoad = (app: firebase.app.App) => {
                app.auth().onAuthStateChanged((user) => {
                    if (user) {
                        next(UserActions.saveUser(convertFirebaseToUser(user)));
                    } else {
                        next(UserActions.saveUser(undefined));
                    }
                });
            };
            FirebaseApp.Instance.addActionToQueue(doOnAppLoad);
            break;
        case UserActions.Type.SIGN_IN:
            const payload: { email: string; password: string } = action.payload;
            if (instance.firebaseApp) {
                instance.firebaseApp
                    .auth()
                    .signInWithEmailAndPassword(payload.email, payload.password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        if (user) {
                            next(UserActions.saveUser(convertFirebaseToUser(user)));
                        } else {
                            next(UtilActions.showError('Invalid Firebase user'));
                        }
                    })
                    .catch((err) => {
                        next(UtilActions.showError(err.message || err));
                    });
            } else {
                next(UtilActions.showError('Authentication network is down'));
            }
            break;
        case UserActions.Type.LOG_OUT:
            if (instance.firebaseApp) {
                instance.firebaseApp
                    .auth()
                    .signOut()
                    // .then(() => {
                    //     next(UserActions.saveUser(undefined));
                    // })
                    .catch((err) => {
                        next(UtilActions.showError(err.message || err));
                    });
            } else {
                next(UtilActions.showError('Authentication network is down'));
            }
        default:
            next(action);
    }
};

const convertFirebaseToUser = (user: firebase.User) => {
    return new LoggedInUser(user.uid, user.displayName || '', user.email || '');
};
