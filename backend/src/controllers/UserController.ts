import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import User from '../models/User';
import { handleError } from './helper';

export default class UserController {
    constructor(private auth: admin.auth.Auth) {}

    async register(req: functions.Request, res: functions.Response) {
        const user: User = new User(req.body);
        this.auth
            .createUser(user)
            .then((userRecord) => {
                res.send(userRecord);
            })
            .catch(handleError('Could not create user', res));
    }
}
