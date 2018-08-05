import * as React from 'react';
import { RouteComponentProps } from 'react-router';

export namespace MapPage {
    export interface Props extends RouteComponentProps<void> {}
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class MapPage extends React.Component<MapPage.Props> {
    render() {
        return <div>Some map</div>;
    }
}
