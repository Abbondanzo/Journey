import { UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import { User, UserRole } from '@app/models';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
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
                                // Resolve
                                if (action.payload) {
                                    action.payload();
                                }
                            })
                            .catch((err) => {
                                next(
                                    UtilActions.showError(
                                        `Unable to get profile details: ${err.message || err}`
                                    )
                                );
                                // Resolve
                                if (action.payload) {
                                    action.payload();
                                }
                            });
                    } else {
                        next(UserActions.setLoggedInUser(undefined));
                        // Resolve
                        if (action.payload) {
                            action.payload();
                        }
                    }
                });
            };
            FirebaseApp.Instance.addActionToQueue(doOnAppLoad);
            break;
        case UserActions.Type.UPLOAD_PROFILE_IMAGE:
            const userId = state.users.loggedInUser;
            if (userId) {
                firebaseService
                    .saveProfileImage(userId, action.payload)
                    .then((snapshot: firebase.storage.UploadTaskSnapshot) => {
                        const user = getUserById(userId, state.users);
                        if (user) {
                            user.profileDetails.profileImage = snapshot.metadata.fullPath;
                            return userService.saveUser(user);
                        } else {
                            throw new Error('Unable to find user to update');
                        }
                    })
                    .then((newUser) => {
                        const existingUser = getUserById(newUser.uid, state.users);
                        next(
                            UserActions.saveUser(
                                Object.assign(existingUser, {
                                    profileDetails: newUser.profileDetails
                                })
                            )
                        );
                        return firebaseService.getProfileImage(newUser.profileDetails.profileImage);
                    })
                    .then((profileImageUrl) => {
                        next(
                            UserActions.saveProfileImage({
                                userId: userId,
                                url: profileImageUrl
                            })
                        );
                    })
                    .catch((err) => {
                        next(
                            UtilActions.showError(
                                `Unable to save profile picture: ${err.message || err}`
                            )
                        );
                    });
            } else {
                next(UtilActions.showError(`Must be logged in to change profile image`));
            }
            break;
        case UserActions.Type.LOAD_ALL_USERS:
            userService
                .getAllProfiles()
                .then((users) => {
                    next(UserActions.saveAllUsers(users));
                    // Resolve
                    if (action.payload) {
                        action.payload();
                    }
                    for (const user of users) {
                        firebaseService
                            .getProfileImage(user.profileDetails.profileImage)
                            .then((profileImageUrl) => {
                                next(
                                    UserActions.saveProfileImage({
                                        userId: user.uid,
                                        url: profileImageUrl
                                    })
                                );
                            });
                    }
                })
                .catch((err) => {
                    // Resolve
                    if (action.payload) {
                        action.payload();
                    }
                    next(UtilActions.showError(`Unable to get load users: ${err.message || err}`));
                });
            break;
        case UserActions.Type.CREATE_USER:
            const createUser: {
                displayName: string;
                email: string;
                password: string;
                role: UserRole;
            } =
                action.payload;
            userService
                .createUser(
                    createUser.email,
                    createUser.password,
                    createUser.displayName,
                    createUser.role
                )
                .then((newUser) => {
                    next(UserActions.saveUser(newUser));
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to create user: ${err.message || err}`));
                });
            break;
        case UserActions.Type.DELETE_USER:
            const deleteUserId: string = action.payload;
            userService
                .deleteUser(deleteUserId)
                .then(() => {
                    next(UserActions.deleteUser(deleteUserId));
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to delete user: ${err.message || err}`));
                });
            break;
        case UserActions.Type.UPDATE_USER:
            const user: User = action.payload;
            userService
                .saveUser(user)
                .then((newUser) => {
                    next(UserActions.saveUser(newUser));
                })
                .catch((err) => {
                    next(UtilActions.showError(`Unable to save user: ${err.message || err}`));
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
            const registerPayload: { email: string; password: string; username: string } =
                action.payload;
            userService
                .registerUser(
                    registerPayload.email,
                    registerPayload.password,
                    registerPayload.username
                )
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
        case UserActions.Type.FOLLOW_USER:
        case UserActions.Type.UNFOLLOW_USER:
            const followPayload: { follower: User['uid']; following: User['uid'] } = action.payload;
            const follower = getUserById(followPayload.follower, state.users);
            if (follower) {
                // First, remove all records of the user we wish to follow/unfollow
                const following = [...follower.profileDetails.following].filter((userId) => {
                    return userId !== followPayload.following;
                });
                // Add that record back if we want to follow that user
                if (action.type === UserActions.Type.FOLLOW_USER) {
                    following.push(followPayload.following);
                }
                follower.profileDetails.following = following;
                userService
                    .saveUser(follower)
                    .then((newUser) => {
                        next(UserActions.saveUser(newUser));
                    })
                    .catch((err) => {
                        next(
                            UtilActions.showError(`Error changing followers: ${err.message || err}`)
                        );
                    });
            } else {
                next(UtilActions.showError(`Unable to find logged in user`));
            }

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

    registerUser(email: string, password: string, displayName: string) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            axios({
                method: 'post',
                url: `/api/register`,
                data: {
                    email,
                    password,
                    displayName
                },
                ...this.baseConfig
            })
                .then(this.resolveUser(resolve))
                .catch(this.rejectForbiddenError(reject));
        });
    }

    createUser(email: string, password: string, displayName: string, role: UserRole) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            axios({
                method: 'post',
                url: `/api/user`,
                data: {
                    email,
                    password,
                    displayName,
                    role
                },
                ...this.baseConfig
            })
                .then(this.resolveUser(resolve))
                .catch(this.rejectForbiddenError(reject));
        });
    }

    deleteUser(userId: string) {
        return new Promise((resolve: () => void, reject: any) => {
            FirebaseApp.Instance.getBearerToken()
                .then((bearerToken) => {
                    return axios({
                        method: 'delete',
                        url: `/api/user/${userId}`,
                        ...this.baseConfig,
                        headers: { Authorization: bearerToken, 'Content-Type': 'application/json' }
                    });
                })
                .then(resolve)
                .catch(this.rejectForbiddenError(reject));
        });
    }

    saveUser(user: User) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            FirebaseApp.Instance.getBearerToken()
                .then((bearerToken) => {
                    return axios({
                        method: 'put',
                        url: `/api/user/${user.uid}`,
                        data: user,
                        ...this.baseConfig,
                        headers: { Authorization: bearerToken, 'Content-Type': 'application/json' }
                    });
                })
                .then(this.resolveUser(resolve, user))
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

    createUser(email: string, password: string) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            if (this.app) {
                this.app
                    .auth()
                    .createUserWithEmailAndPassword(email, password)
                    .then((userCredentials) => {
                        const user = userCredentials.user;
                        if (user) {
                            resolve(convertFirebaseToUser(user));
                        } else {
                            reject(new Error('Unable to create user'));
                        }
                    });
            } else {
                reject(new Error('Authentication network is down'));
            }
        });
    }

    saveProfile(user: User) {
        return new Promise((resolve: (user: User) => void, reject: any) => {
            if (this.app) {
                const auth = this.app.auth();
                const currentUser = auth.currentUser;
                if (currentUser) {
                    currentUser
                        .updateProfile({
                            displayName: user.displayName,
                            photoURL: user.photoURL
                        })
                        .then(() => {
                            resolve(user);
                        });
                } else {
                    reject(new Error('Not logged in'));
                }
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

    saveProfileImage(userId: string, file: File) {
        return new Promise(
            (resolve: (snapshot: firebase.storage.UploadTaskSnapshot) => void, reject: any) => {
                if (this.app) {
                    this.app
                        .storage()
                        .ref(`${userId}/${file.name}`)
                        .put(file)
                        .then(resolve);
                } else {
                    reject(new Error('Storage network is down or connection not created'));
                }
            }
        );
    }
}
