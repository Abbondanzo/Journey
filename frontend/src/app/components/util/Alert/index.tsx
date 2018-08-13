import * as React from 'react';
import './style.scss';

export namespace Alert {
    export interface Props {
        message?: string;
        isError: boolean;
        hideMessage(): void;
    }
}

export class Alert extends React.Component<Alert.Props> {
    constructor(props: Alert.Props) {
        super(props);
        this.hideMessage = this.hideMessage.bind(this);
    }

    componentWillReceiveProps(props: Alert.Props) {
        if (props.message) {
            setTimeout(function() {
                props.hideMessage();
            }, 5000);
        }
    }

    hideMessage() {
        this.props.hideMessage();
    }

    render() {
        const containerClasses = ['alert-container'];
        const successClasses = ['alert', 'alert-success', 'fade'];
        const errorClasses = ['alert', 'alert-danger', 'fade'];
        if (this.props.message) {
            containerClasses.push('show');
            successClasses.push('show');
            errorClasses.push('show');
        }
        return (
            <div className={containerClasses.join(' ')}>
                <div
                    className={
                        this.props.isError ? errorClasses.join(' ') : successClasses.join(' ')
                    }
                >
                    {this.props.message}
                    <button
                        type="button"
                        className="close"
                        data-dismiss="alert"
                        aria-label="Close"
                        onClick={this.hideMessage}
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            </div>
        );
    }
}
