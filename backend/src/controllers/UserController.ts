import * as functions from 'firebase-functions';
import User from '../models/User';
import UserCollection from '../schema/UserCollection';
import { handleCatchError, handleError } from './helper';

export default class UserController {
    static async register(req: functions.Request, res: functions.Response) {
        if (!req.body.email) {
            handleError('Invalid request body', res, Error('Missing user email'));
            return;
        }
        const user: User = new User(req.body);
        UserCollection.createUser(user)
            .then((userRecord) => {
                res.send(userRecord);
            })
            .catch(handleCatchError('Could not create user', res));
    }
}
