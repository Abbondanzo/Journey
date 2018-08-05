import { UtilActions } from '@app/actions/util';
import * as React from 'react';
import { Action, handleActions } from 'redux-actions';

export interface UtilState {
    googleMapComponent?: React.StatelessComponent;
    isMapsComponentShowing: boolean;
}

const initialState: UtilState = {
    isMapsComponentShowing: false
};

export const utilReducer = handleActions<UtilState, any>(
    {
        [UtilActions.Type.LOAD_MAP]: (
            state: UtilState,
            action: Action<React.StatelessComponent>
        ): UtilState => {
            console.log('action', action.payload);
            return {
                ...state,
                googleMapComponent: action.payload
            };
        }
    },
    initialState
);
