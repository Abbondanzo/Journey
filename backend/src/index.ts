import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import Router from './routers';
import express from './config/express';

admin.initializeApp(functions.config().firebase);

const firestoreInstance = admin.firestore();
new Router(express.app, firestoreInstance);

export const api = functions.https.onRequest(express.app);
