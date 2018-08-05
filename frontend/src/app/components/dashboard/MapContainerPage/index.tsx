import { UtilActions } from '@app/actions/util';
import Post from '@app/models/Post';
import * as React from 'react';
import { GoogleMap, WithGoogleMapProps, WithScriptjsProps } from 'react-google-maps';

export namespace MapContainerPage {
    export interface Props extends WithScriptjsProps, WithGoogleMapProps {
        posts: Post[];
        actions: UtilActions;
    }
}

/**
 * Since Google Maps API charges the user per static map load, we don't ever want to unmount the
 * component. Instead, we can store it per every application load and simply offer a way to show or
 * hide the component in various places. This component should never be imported directly but
 * instead called to be added to the store whenever necessary.
 */
export class MapContainerPage extends React.Component<MapContainerPage.Props> {
    componentWillMount() {
        console.log('mounting');
    }

    componentWillUnmount() {
        console.log('unmounting');
    }

    render() {
        return (
            <div className="row">
                <GoogleMap defaultZoom={8} defaultCenter={{ lat: -34.397, lng: 150.644 }} />
            </div>
        );
    }
}
