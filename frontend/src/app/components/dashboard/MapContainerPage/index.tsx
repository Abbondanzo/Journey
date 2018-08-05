import { UtilActions } from '@app/actions/util';
import Post from '@app/models/Post';
import * as React from 'react';

export namespace MapContainerPage {
    export interface Props {
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
    private constructor(props: MapContainerPage.Props) {
        super(props);
    }

    componentWillMount() {
        console.log('mounting');
    }

    componentWillUnmount() {
        console.log('unmounting');
    }

    render() {
        return <div className="row">This is where my map goes</div>;
    }
}
