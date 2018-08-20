import { NextFunction, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { UserRole } from '../models/User';
import UserCollection from '../schema/UserCollection';
let serviceAccountKey = require('../config/serviceAccountKey.json');

const adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    databaseURL: 'https://journey-a2a8f.firebaseio.com',
    storageBucket: 'journey-a2a8f.appspot.com'
});
const firestoreSettings: FirebaseFirestore.Settings = {
    timestampsInSnapshots: true
};

export const firestoreInstance: FirebaseFirestore.Firestore = adminApp.firestore();
firestoreInstance.settings(firestoreSettings);
export const authInstance = adminApp.auth();
export const storageInstance = adminApp.storage();

/**
 * Special thanks to Firebase for providing this function sample:
 * https://github.com/firebase/functions-samples/blob/master/authorized-https-endpoint/functions/index.js
 *
 * Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
 * The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header
 * like this:
 * `Authorization: Bearer <Firebase ID Token>`.
 * when decoded successfully, the ID Token content will be added as `req.user`.
 * @param req
 * @param res
 * @param next
 */
export const firebaseIdToken = (req: Request, res: Response, next: NextFunction) => {
    console.log('Check if request is authorized with Firebase ID token');

    if (
        (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)
    ) {
        console.error(
            'No Firebase ID token was passed as a Bearer token in the Authorization header.',
            'Make sure you authorize your request by providing the following HTTP header:',
            'Authorization: Bearer <Firebase ID Token>',
            'or by passing a "__session" cookie.'
        );
        res.status(403).send('Unauthorized');
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        console.log('Found "Authorization" header');
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else if (req.cookies) {
        console.log('Found "__session" cookie');
        // Read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // No cookie
        res.status(403).send('Unauthorized');
        return;
    }
    admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedIdToken) => {
            console.log('ID Token correctly decoded', decodedIdToken);
            (req as any).user = decodedIdToken;
            return next();
        })
        .catch((error) => {
            console.error('Error while verifying Firebase ID token:', error);
            res.status(403).send('Unauthorized');
        });
};

export const handleError = (errMessage: string, res: Response, err: any, errCode = 403) => {
    const message = {
        message: errMessage,
        error: err.message || err
    };
    res.status(errCode).send(message);
};

export const handleCatchError = (errMessage: string, res: Response, errCode = 403) => {
    return (err: any) => {
        handleError(errMessage, res, err, errCode);
    };
};

export class PermissionsManager {
    static async canEditAllPosts(req: Request) {
        return this.getUser(req).then((user) => {
            const role = user.profileDetails.role;
            return role === UserRole.MODERATOR || role === UserRole.ADMINISTRATOR;
        });
    }

    static getToken(req: Request) {
        return (req as any).user as admin.auth.DecodedIdToken;
    }

    private static getUser(req: Request) {
        const token = this.getToken(req);
        return UserCollection.findUserById(token.uid);
    }
}
