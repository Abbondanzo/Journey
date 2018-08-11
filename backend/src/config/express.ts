import * as admin from 'firebase-admin';
import * as cookieParser from 'cookie-parser';

import cors from 'cors';
import express from 'express';

class Express {
    public app: express.Express;

    constructor() {
        this.init();
    }

    private init() {
        this.app = express();
        this.app.use(cookieParser());
        this.app.use(this.cors());
        this.app.use(this.firebaseIdToken);
    }

    /**
     * Returns cors with set configuration. Use this to whitelist certain sites.
     */
    private cors() {
        return cors({
            origin: true
        });
    }

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
    private firebaseIdToken(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
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
                req.user = decodedIdToken;
                return next();
            })
            .catch((error) => {
                console.error('Error while verifying Firebase ID token:', error);
                res.status(403).send('Unauthorized');
            });
    }
}

export default new Express();
