import { PostActions } from '@app/actions';
import Post from '@app/models/Post';
import * as React from 'react';

export namespace PostFeedPage {
    export interface Props {
        posts: Post[];
        actions: PostActions;
    }

    export interface State {}
}

export class PostFeedPage extends React.Component<PostFeedPage.Props, PostFeedPage.State> {
    constructor(props: PostFeedPage.Props) {
        super(props);
        this.state = {};
    }

    render() {
        return <div>Test</div>;
    }
}
