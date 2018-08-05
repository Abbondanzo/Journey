import { createAction } from 'redux-actions';

export namespace UtilActions {
    export enum Type {
        SHOW_MAP = 'SHOW_MAP',
        HIDE_MAP = 'HIDE_MAP',
        LOAD_MAP = 'LOAD_MAP'
    }

    export const showMap = createAction(Type.SHOW_MAP);
    export const hideMap = createAction(Type.HIDE_MAP);
    export const loadMap = createAction<React.Component>(Type.LOAD_MAP);
}

export type UtilActions = Omit<typeof UtilActions, 'Type'>;
