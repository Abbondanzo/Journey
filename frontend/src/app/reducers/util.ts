import { UtilActions } from '@app/actions/util';
import * as React from 'react';
import { Action, handleActions } from 'redux-actions';

export interface UtilState {
    googleMapURL: string;
    googleMapComponent?: React.StatelessComponent;
    mapBounds: google.maps.LatLngBounds;
    isMapsComponentShowing: boolean;
    successMessage?: string;
    errorMessage?: string;
    isLoading: boolean;
}

const apiKey = process.env.GOOGLE_MAPS_API;
let mapUrl = 'https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places';
if (apiKey && process.env.NODE_ENV === 'production') {
    mapUrl += `&key=${apiKey}`;
}

const initialState: UtilState = {
    googleMapURL: mapUrl,
    isMapsComponentShowing: false,
    mapBounds: {} as google.maps.LatLngBounds, // TODO:
    isLoading: false
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
        },
        [UtilActions.Type.SET_BOUNDS]: (
            state: UtilState,
            action: Action<google.maps.LatLngBounds>
        ): UtilState => {
            return {
                ...state,
                mapBounds: action.payload ? action.payload : state.mapBounds
            };
        },
        [UtilActions.Type.SHOW_SUCCESS]: (state: UtilState, action: Action<string>): UtilState => {
            return {
                ...state,
                successMessage: action.payload
            };
        },
        [UtilActions.Type.SHOW_ERROR]: (state: UtilState, action: Action<string>): UtilState => {
            return {
                ...state,
                errorMessage: action.payload
            };
        },
        [UtilActions.Type.HIDE_SUCCESS]: (state: UtilState, _: Action<any>): UtilState => {
            return {
                ...state,
                successMessage: undefined
            };
        },
        [UtilActions.Type.HIDE_ERROR]: (state: UtilState, _: Action<any>): UtilState => {
            return {
                ...state,
                errorMessage: undefined
            };
        },
        [UtilActions.Type.SHOW_LOADING]: (state: UtilState, _: Action<any>): UtilState => {
            return {
                ...state,
                isLoading: true
            };
        },
        [UtilActions.Type.HIDE_LOADING]: (state: UtilState, _: Action<any>): UtilState => {
            return {
                ...state,
                isLoading: false
            };
        }
    },
    initialState
);
