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
 *
 * However, we are going to ignore this rule in the interest of development purposes, since Google
 * is lax on its enforcement of API keys for non-production code. In the future, when we wish to
 * deploy a shiny version of this app, we should consider offering some sort of "component"
 * singleton that never unmounts but is merely hidden or displayed wherever necessary.
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
            <GoogleMap defaultZoom={12} defaultCenter={{ lat: 42.36, lng: -71.058 }}>
                {/* <InfoBox
                    defaultPosition={{ lat: 42.3379825, lng: -71.08475909999999 }}
                    options={{ closeBoxURL: ``, enableEventPropagation: true }}
                >
                    <div style={{ backgroundColor: `yellow`, opacity: 0.75, padding: `12px` }}>
                        <div style={{ fontSize: `16px`, color: `#08233B` }}>Hello, Taipei!</div>
                    </div>
                </InfoBox> */}
                {/* <Marker position={{ lat: 42.3379825, lng: -71.08475909999999 }} /> */}
            </GoogleMap>
        );
    }
}
