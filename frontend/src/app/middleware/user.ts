import { AnyAction, Dispatch, Middleware } from 'redux';
import User, { LoggedInUser } from '@app/models/User';

// import { AppState } from '@app/reducers';
import FirebaseApp from '@app/utils/firebase';
import { UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';

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
                        const newUser = convertFirebaseToUser(user);
                        new UserService().getProfileDetails(newUser.id).then((detailedUser) => {
                            next(UserActions.saveUser(Object.assign(newUser, detailedUser)));
                            getProfileImage((detailedUser as any).profileImage, newUser.id, next);
                        });
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
                            const newUser = convertFirebaseToUser(user);
                            new UserService().getProfileDetails(newUser.id).then((detailedUser) => {
                                next(UserActions.saveUser(Object.assign(newUser, detailedUser)));
                                getProfileImage(
                                    (detailedUser as any).profileImage,
                                    newUser.id,
                                    next
                                );
                            });
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
                    .then(() => {
                        next(UserActions.saveUser(undefined));
                    })
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

const getProfileImage = (profileImage: string, userId: string, next: Dispatch<AnyAction>) => {
    const defaultImage = 'default/profile.jpg';
    FirebaseApp.Instance.addActionToQueue((app: firebase.app.App) => {
        app.storage()
            .ref(`${profileImage ? profileImage : defaultImage}`)
            .getDownloadURL()
            .then((downloadUrl) => {
                next(
                    UserActions.saveProfileImage({
                        userId: userId,
                        url: downloadUrl
                    })
                );
            })
            .catch((err) => {
                next(UtilActions.showError(`Unable to load profile image: ${err.message || err}`));
            });
    });
};

class UserService {
    private USER_COLLECTION = '/users';
    getProfileDetails(userId: string) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            FirebaseApp.Instance.addActionToQueue((app: firebase.app.App) => {
                app.firestore()
                    .collection(this.USER_COLLECTION)
                    .where('id', '==', userId)
                    .get()
                    .then(
                        this.resolveUser((users) => {
                            resolve(users[0]);
                        })
                    )
                    .catch(reject);
            });
        });
    }

    private resolveUser(resolve: (users: User[]) => void) {
        return (snapshot: firebase.firestore.QuerySnapshot) => {
            const users: User[] = [];
            snapshot.forEach((doc) => {
                const user = Object.assign({}, new User('', ''), doc.data());
                users.push(user);
            });
            resolve(users);
        };
    }
}
