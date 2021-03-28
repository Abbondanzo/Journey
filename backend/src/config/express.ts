import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';

class Express {
    public app: express.Express;

    constructor() {
        this.init();
    }

    private init() {
        this.app = express();
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(this.cors());
    }

    /**
     * Returns cors with set configuration. Use this to whitelist certain sites.
     */
    private cors() {
        return cors({
            origin: true,
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization']
        });
    }
}

export default new Express();
