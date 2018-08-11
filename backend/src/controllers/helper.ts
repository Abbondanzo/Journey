import { Response } from 'express';

export const handleError = (errMessage: string, res: Response, errCode = 403) => {
    return (err: any) => {
        const message = {
            message: errMessage,
            error: err.message || err
        };
        res.status(errCode).send(message);
    };
};
