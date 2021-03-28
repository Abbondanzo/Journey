import * as functions from 'firebase-functions';
import express from './config/express';
import Router from './routers';

new Router(express.app);

export const api = functions.https.onRequest(express.app);
