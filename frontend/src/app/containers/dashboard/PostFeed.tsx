import { PostActions } from '@app/actions';
import { PostFeedPage } from '@app/components/dashboard/PostFeedPage';
import { AppState } from '@app/reducers';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<PostFeedPage.Props> => {
    return {
        posts: state.posts.posts
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<PostFeedPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(PostActions, 'Type') }, dispatch)
    };
};

const PostFeed = connect(
    mapStateToProps,
    mapDispatchToProps
)(PostFeedPage);

export default (PostFeed as any) as React.StatelessComponent;
