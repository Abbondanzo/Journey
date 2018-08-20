import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import User from '../models/User';
import UserCollection from '../schema/UserCollection';
import { authInstance, handleCatchError, handleError } from './helper';

export default class UserController {
    static async register(req: functions.Request, res: functions.Response) {
        if (!req.body.email) {
            handleError('Invalid request body', res, Error('Missing user email'));
            return;
        }
        const user: User = new User(req.body);
        authInstance
            .createUser(user)
            .then((authUser) => {
                const authorizedUser = new User(Object.assign({}, user, authUser));
                console.log(authorizedUser);
                if (!authorizedUser.uid) {
                    throw Error('Missing user ID!');
                }
                return UserCollection.createUser(authorizedUser);
            })
            .then((user) => {
                res.send(user);
            })
            .catch(handleCatchError('Could not create user', res));
    }

    static async getUserById(req: functions.Request, res: functions.Response) {
        const userId = req.params.userId;
        UserCollection.findUserById(userId)
            .then((user) => {
                res.send(user);
            })
            .catch(handleCatchError('Could not find user', res));
    }

    static async saveUserById(req: functions.Request, res: functions.Response) {
        const userId = req.params.userId;
        const token: admin.auth.DecodedIdToken = (req as any).user;
        const user: User = new User(req.body);
        if (userId !== token.uid) {
            res.status(401).send('Unauthorized');
        } else {
            UserCollection.updateUserById(userId, user)
                .then((user) => {
                    res.send(user);
                })
                .catch(handleCatchError('Could not save user', res));
        }
    }

    static async getAllUsers(_: functions.Request, res: functions.Response) {
        Promise.all([authInstance.listUsers(), UserCollection.findAllUsers()])
            .then((usersResult) => {
                const users = usersResult[0].users.map((userRecord) => {
                    const collectionUser = usersResult[1].filter((user) => {
                        return user.uid === userRecord.uid;
                    })[0];
                    return new User(Object.assign({}, userRecord, {
                        profileDetails: collectionUser ? collectionUser.profileDetails : {}
                    }) as any);
                });
                res.send(users);
            })
            .catch(handleCatchError('Could not find list of users', res));
    }
}
