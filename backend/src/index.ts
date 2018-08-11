import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import express from './config/express';
import Router from './routers';

admin.initializeApp(functions.config().firebase);

const firestoreInstance = admin.firestore();
const authInstance = admin.auth();
new Router(express.app, firestoreInstance, authInstance);

export const api = functions.https.onRequest(express.app);
