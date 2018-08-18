import { createAction } from 'redux-actions';

export namespace UtilActions {
    export enum Type {
        LOAD_APP = 'LOAD_APP',
        SHOW_MAP = 'SHOW_MAP',
        HIDE_MAP = 'HIDE_MAP',
        LOAD_MAP = 'LOAD_MAP',
        SET_BOUNDS = 'SET_BOUNDS',
        SHOW_SUCCESS = 'SHOW_SUCCESS',
        HIDE_SUCCESS = 'HIDE_SUCCESS',
        SHOW_ERROR = 'SHOW_ERROR',
        HIDE_ERROR = 'HIDE_ERROR'
    }

    export const loadApp = createAction(Type.LOAD_APP);
    export const showMap = createAction(Type.SHOW_MAP);
    export const hideMap = createAction(Type.HIDE_MAP);
    export const loadMap = createAction<React.Component>(Type.LOAD_MAP);
    export const setBounds = createAction<google.maps.LatLngBounds>(Type.SET_BOUNDS);
    export const showSuccess = createAction<string>(Type.SHOW_SUCCESS);
    export const hideSuccess = createAction(Type.HIDE_SUCCESS);
    export const showError = createAction<string>(Type.SHOW_ERROR);
    export const hideError = createAction(Type.HIDE_ERROR);
}

export type UtilActions = Omit<typeof UtilActions, 'Type'>;
