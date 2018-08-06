import { UtilActions } from '@app/actions/util';
import Post from '@app/models/Post';
import * as React from 'react';
import { GoogleMap, Marker, WithGoogleMapProps, WithScriptjsProps } from 'react-google-maps';

export namespace MapContainerPage {
    export interface Props extends WithScriptjsProps, WithGoogleMapProps {
        posts: Post[];
        actions: UtilActions;
    }

    export interface State {
        mapPage: React.RefObject<GoogleMap>;
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
export class MapContainerPage extends React.Component<
    MapContainerPage.Props,
    MapContainerPage.State
> {
    constructor(props: MapContainerPage.Props) {
        super(props);
        this.state = {
            mapPage: React.createRef()
        };
        this.onBoundsChanged = this.onBoundsChanged.bind(this);
    }

    componentWillMount() {
        console.log('mounting');
    }

    componentDidMount() {
        this.onBoundsChanged();
    }

    componentWillUnmount() {
        console.log('unmounting');
    }

    onBoundsChanged() {
        const currentMap = this.state.mapPage.current;
        if (currentMap) {
            this.props.actions.setBounds(currentMap.getBounds());
        }
    }

    render() {
        return (
            <GoogleMap
                ref={this.state.mapPage}
                defaultZoom={12}
                defaultCenter={{ lat: 42.36, lng: -71.058 }}
                // This fires too much onBoundsChanged={this.onBoundsChanged}
                onDragEnd={this.onBoundsChanged}
                onZoomChanged={this.onBoundsChanged}
            >
                {this.props.posts.map((post: Post, index: number) => {
                    if (post.geocode) {
                        const coordinates = post.geocode.geometry.location;
                        return (
                            <Marker
                                key={index}
                                position={{ lat: coordinates.lat(), lng: coordinates.lng() }}
                            />
                        );
                    }
                    return undefined;
                })}
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
