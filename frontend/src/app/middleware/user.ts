import { AnyAction, Dispatch, Middleware } from 'redux';
import axios, { AxiosResponse } from 'axios';

// import { AppState } from '@app/reducers';
import FirebaseApp from '@app/utils/firebase';
import { User } from '@app/models';
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
                        new UserService()
                            .getProfileDetails(newUser)
                            .then((detailedUser) => {
                                next(UserActions.saveUser(Object.assign(newUser, detailedUser)));
                                getProfileImage(
                                    (detailedUser as any).profileImage,
                                    newUser.uid,
                                    next
                                );
                            })
                            .catch((err) => {
                                next(
                                    UtilActions.showError(
                                        `Unable to get profile details: ${err.message || err}`
                                    )
                                );
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
                            new UserService()
                                .getProfileDetails(newUser)
                                .then((detailedUser) => {
                                    next(
                                        UserActions.saveUser(Object.assign(newUser, detailedUser))
                                    );
                                    getProfileImage(
                                        (detailedUser as any).profileImage,
                                        newUser.uid,
                                        next
                                    );
                                })
                                .catch((err) => {
                                    next(
                                        UtilActions.showError(
                                            `Unable to get profile details: ${err.message || err}`
                                        )
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
    return new User(user);
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
    private baseConfig = {
        baseURL:
            process.env.NODE_ENV === 'production'
                ? 'https://us-central1-journey-a2a8f.cloudfunctions.net'
                : 'http://localhost:5000/journey-a2a8f/us-central1',
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    getProfileDetails(user: User) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            axios({
                method: 'get',
                url: `/api/user-profile/${user.uid}`,
                ...this.baseConfig
            })
                .then(this.resolveUser(resolve, user))
                .catch(reject);
        });
    }

    private resolveUser(resolve: (user: User) => void, user?: User) {
        return (response: AxiosResponse<any>) => {
            const newUser = new User(Object.assign({}, user, response.data));
            resolve(newUser);
        };
    }
}
