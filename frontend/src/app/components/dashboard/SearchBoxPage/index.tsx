import * as React from 'react';
import { WithGoogleMapProps, WithScriptjsProps } from 'react-google-maps';
import StandaloneSearchBox from 'react-google-maps/lib/components/places/StandaloneSearchBox';
import './style.scss';

export namespace SearchBoxPage {
    export interface Props extends WithScriptjsProps, WithGoogleMapProps {
        id?: string;
        bounds: google.maps.LatLngBounds;
        onPlacesChanged(places: google.maps.places.PlaceResult[]): void;
    }
    export interface State {
        searchBox: React.RefObject<any>;
    }
}

export class SearchBoxPage extends React.Component<SearchBoxPage.Props, SearchBoxPage.State> {
    constructor(props: SearchBoxPage.Props) {
        super(props);

        this.state = {
            searchBox: React.createRef()
        };
        this.onPlacesChanged = this.onPlacesChanged.bind(this);
    }

    onPlacesChanged() {
        this.props.onPlacesChanged(this.state.searchBox.current.getPlaces());
    }

    componentWillMount() {
        console.log('mounting');
    }

    componentWillUnmount() {
        console.log('unmounting');
    }

    render() {
        return (
            <div>
                <StandaloneSearchBox
                    ref={this.state.searchBox}
                    bounds={this.props.bounds}
                    onPlacesChanged={this.onPlacesChanged}
                >
                    <input
                        type="text"
                        placeholder="Search for an address"
                        className="form-control"
                        id={this.props.id}
                    />
                </StandaloneSearchBox>
            </div>
        );
    }
}
