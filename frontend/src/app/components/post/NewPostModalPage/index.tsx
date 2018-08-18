import { PostActions } from '@app/actions';
import * as React from 'react';
import './style.scss';

export namespace NewPostModalPage {
    export interface Props {
        isShowing: boolean;
        actions: PostActions;
    }
}

export class NewPostModalPage extends React.Component<NewPostModalPage.Props> {
    constructor(props: NewPostModalPage.Props) {
        super(props);
    }

    preventCallback(event: React.MouseEvent<any>) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    render() {
        return this.props.isShowing ? (
            <div className="post-modal-container modal" onClick={this.props.actions.hidePostModal}>
                <div className="post-modal modal-dialog">
                    <div className="modal-content" onClick={this.preventCallback}>
                        gg
                    </div>
                </div>
            </div>
        ) : null;
    }
}
