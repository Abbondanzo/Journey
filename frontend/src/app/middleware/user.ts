import { UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
// import { AppState } from '@app/reducers';
import FirebaseApp from '@app/utils/firebase';
import { AnyAction, Dispatch, Middleware } from 'redux';

export const authMiddleware: Middleware = (store) => (next: Dispatch<AnyAction>) => (
    action: AnyAction
) => {
    // const state: AppState = store.getState();
    switch (action.type) {
        case UserActions.Type.SIGN_IN:
            const payload: { email: string; password: string } = action.payload;
            const app = FirebaseApp.Instance.firebaseApp;
            if (app) {
                app.auth()
                    .signInWithEmailAndPassword(payload.email, payload.password)
                    .then((userCredential) => {
                        console.info(userCredential);
                    })
                    .catch((err) => {
                        next(UtilActions.showError(err.message || err));
                    });
            }
            break;
        default:
            next(action);
    }
};
