import { UtilActions } from '@app/actions/util';
import * as React from 'react';
import { Action, handleActions } from 'redux-actions';

export interface UtilState {
    googleMapURL: string;
    googleMapComponent?: React.StatelessComponent;
    isMapsComponentShowing: boolean;
}

const initialState: UtilState = {
    googleMapURL:
        'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places',
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
