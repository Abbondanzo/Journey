import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import User from '../models/User';
import { handleCatchError, handleError } from './helper';

export default class UserController {
    static async register(req: functions.Request, res: functions.Response) {
        if (!req.body.email) {
            console.log('invalid');
            handleError('Invalid request body', res, Error('Missing user email'));
            return;
        }
        const user: User = new User(req.body);
        console.log(user);
        admin
            .auth()
            .createUser(user)
            .then((userRecord) => {
                res.send(userRecord);
            })
            .catch(handleCatchError('Could not create user', res));
    }
}
