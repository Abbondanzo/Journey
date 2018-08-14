import * as React from 'react';

import { Link } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

export namespace HomePage {
    export interface Props extends RouteComponentProps<void> {}
}

/**
 * This is the page that gets displayed to users who haven't logged in yet. Mostly static content.
 */
export class HomePage extends React.Component<HomePage.Props> {
    render() {
        return (
            <div>
                <Link to="/map">Go to map</Link>
            </div>
        );
    }
}
