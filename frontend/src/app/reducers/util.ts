import { UtilActions } from '@app/actions/util';
import * as React from 'react';
import { Action, handleActions } from 'redux-actions';

export interface UtilState {
    googleMapURL: string;
    googleMapComponent?: React.StatelessComponent;
    isMapsComponentShowing: boolean;
}

const apiKey = process.env.GOOGLE_MAPS_API;
let mapUrl = 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places';
if (apiKey && process.env.NODE_ENV === 'production') {
    mapUrl += `&key=${apiKey}`;
}

const initialState: UtilState = {
    googleMapURL: mapUrl,
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
