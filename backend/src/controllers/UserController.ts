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
            .then((userRecord) => {
                res.send(userRecord);
            })
            .catch(handleCatchError('Could not create user', res));
    }

    static async getUserById(req: functions.Request, res: functions.Response) {
        const userId = req.params.userId;
        UserCollection.findUserById(userId)
            .then((userRecords) => {
                const user = userRecords.docs[0];
                res.send(user);
            })
            .catch(handleCatchError('Could not find user', res));
    }

    static async saveUserById(req: functions.Request, res: functions.Response) {
        const userId = req.params.userId;
        const token: admin.auth.DecodedIdToken = (req as any).user;
        if (userId !== token.uid) {
            res.status(401).send('Unauthorized');
        } else {
            // Do update
        }
    }

    static async getAllUsers(_: functions.Request, res: functions.Response) {
        authInstance
            .listUsers()
            .then((usersResult) => {
                const ids = usersResult.users.map((userRecord) => {
                    return userRecord.uid;
                });
                return UserCollection.findUsersByIds(ids);
            })
            .then((snapshot) => {
                res.send(snapshot.docs);
            })
            .catch(handleCatchError('Could not find list of users', res));
    }
}
