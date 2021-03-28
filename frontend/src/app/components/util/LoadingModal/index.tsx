import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import './style.scss';

export namespace LoadingModal {
    export interface Props extends Partial<RouteComponentProps<void>> {
        loading: boolean;
    }
}

export class LoadingModal extends React.Component<LoadingModal.Props> {
    constructor(props: LoadingModal.Props) {
        super(props);
    }

    render() {
        return this.props.loading ? (
            <div className="post-modal-container modal">
                <div className="post-modal modal-dialog">
                    <div className="modal-content">
                        <div className="modal-body">
                            <div className="loader">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        ) : null;
    }
}
