import { UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import { User } from '@app/models';
import { AppState } from '@app/reducers';
import FirebaseApp from '@app/utils/firebase';
import axios, { AxiosResponse } from 'axios';
import { AnyAction, Dispatch, Middleware } from 'redux';

export const authMiddleware: Middleware = (store) => (next: Dispatch<AnyAction>) => (
    action: AnyAction
) => {
    const state: AppState = store.getState();
    const userService = new UserService();
    const firebaseService = new FirebaseService();
    switch (action.type) {
        case UserActions.Type.LOAD_AUTH_USER:
            // Sets subscriber
            const doOnAppLoad = (app: firebase.app.App) => {
                app.auth().onAuthStateChanged((user) => {
                    if (user) {
                        const newUser = convertFirebaseToUser(user);
                        next(UserActions.setLoggedInUser(newUser.uid));
                        userService
                            .getProfileDetails(newUser)
                            .then((detailedUser) => {
                                next(UserActions.saveUser(Object.assign(newUser, detailedUser)));
                                return new FirebaseService().getProfileImage(
                                    detailedUser.profileDetails.profileImage
                                );
                            })
                            .then((profileImageUrl) => {
                                next(
                                    UserActions.saveProfileImage({
                                        userId: user.uid,
                                        url: profileImageUrl
                                    })
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
                        next(UserActions.setLoggedInUser(undefined));
                    }
                });
            };
            FirebaseApp.Instance.addActionToQueue(doOnAppLoad);
            break;
        case UserActions.Type.LOAD_ALL_USERS:
            userService
                .getAllProfiles()
                .then((users) => {
                    next(UserActions.saveAllUsers(users));
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to get load users: ${err.message || err}`));
                });
            break;
        case UserActions.Type.SIGN_IN:
            const payload: { email: string; password: string } = action.payload;
            firebaseService
                .signIn(payload.email, payload.password)
                .then((user) => {
                    userService
                        .getProfileDetails(user)
                        .then((detailedUser) => {
                            next(UserActions.saveUser(Object.assign(user, detailedUser)));
                            return firebaseService.getProfileImage(
                                detailedUser.profileDetails.profileImage
                            );
                        })
                        .then((profileImageUrl) => {
                            next(
                                UserActions.saveProfileImage({
                                    userId: user.uid,
                                    url: profileImageUrl
                                })
                            );
                        })
                        .catch((err) => {
                            next(
                                UtilActions.showError(
                                    `Unable to get profile details: ${err.message || err}`
                                )
                            );
                        });
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to sign in: ${err.message || err}`));
                });
            break;
        case UserActions.Type.REGISTER_USER:
            const registerPayload: { email: string; password: string } = action.payload;
            userService
                .registerUser(registerPayload.email, registerPayload.password)
                .then((_) => {
                    return firebaseService.signIn(registerPayload.email, registerPayload.password);
                })
                .then((loggedInUser) => {
                    next(UserActions.saveUser(loggedInUser));
                    next(
                        UserActions.saveProfileImage({
                            userId: loggedInUser.uid,
                            url: state.users.userProfileImages.get('default') || ''
                        })
                    );
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to register: ${err.message || err}`));
                });
            break;
        case UserActions.Type.LOG_OUT:
            firebaseService
                .logOut()
                .then(() => {
                    next(UserActions.logOut());
                })
                .catch((err) => {
                    next(UtilActions.showError(`Error logging out: ${err.message || err}`));
                });
        default:
            next(action);
    }
};

const convertFirebaseToUser = (user: firebase.User) => {
    return new User(user);
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

    getAllProfiles() {
        return new Promise((resolve: (users: User[]) => void, reject: any) => {
            axios({
                method: 'get',
                url: `/api/user`,
                ...this.baseConfig
            })
                .then(this.resolveUsers(resolve))
                .catch(this.rejectForbiddenError(reject));
        });
    }

    getProfileDetails(user: User) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            axios({
                method: 'get',
                url: `/api/user/${user.uid}`,
                ...this.baseConfig
            })
                .then(this.resolveUser(resolve, user))
                .catch(this.rejectForbiddenError(reject));
        });
    }

    registerUser(email: string, password: string) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            axios({
                method: 'post',
                url: `/api/register`,
                data: {
                    email,
                    password
                },
                ...this.baseConfig
            })
                .then(this.resolveUser(resolve))
                .catch(this.rejectForbiddenError(reject));
        });
    }

    private rejectForbiddenError(reject: any) {
        return (err: any) => {
            if (err.response) {
                const data = err.response.data;
                reject(data.error || data.message || data);
            } else {
                reject(err);
            }
        };
    }

    private resolveUser(resolve: (user: User) => void, user?: User) {
        return (response: AxiosResponse<any>) => {
            const newUser = new User(Object.assign({}, user, response.data));
            resolve(newUser);
        };
    }

    private resolveUsers(resolve: (users: User[]) => void) {
        return (response: AxiosResponse<any>) => {
            const users = [];
            const userObjects = response.data || [];
            for (const userObject of userObjects) {
                const newUser = new User(userObject);
                users.push(newUser);
            }
            resolve(users);
        };
    }
}

class FirebaseService {
    private app = FirebaseApp.Instance.firebaseApp;

    signIn(email: string, password: string) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            if (this.app) {
                this.app
                    .auth()
                    .signInWithEmailAndPassword(email, password)
                    .then((userCredentials) => {
                        const user = userCredentials.user;
                        if (user) {
                            resolve(convertFirebaseToUser(user));
                        } else {
                            reject(new Error('Unable to sign in as this user'));
                        }
                    });
            } else {
                reject(new Error('Authentication network is down'));
            }
        });
    }

    logOut() {
        return new Promise((resolve: () => void, reject: any) => {
            if (this.app) {
                this.app
                    .auth()
                    .signOut()
                    .then(resolve);
            } else {
                reject(new Error('Authentication network is down'));
            }
        });
    }

    getProfileImage(profileImage: string | undefined) {
        return new Promise((resolve: (profileImageUrl: string) => void, reject: any) => {
            if (this.app) {
                const defaultImage = 'default/profile.jpg';
                this.app
                    .storage()
                    .ref(`${profileImage ? profileImage : defaultImage}`)
                    .getDownloadURL()
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('Storage network is down or connection not created'));
            }
        });
    }
}
