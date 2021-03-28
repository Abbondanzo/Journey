import { PostActions } from '@app/actions';
import { PostRowComponent } from '@app/components/post/PostRowComponent';
import Post from '@app/models/Post';
import { AppState } from '@app/reducers';
import { PermissionsManager } from '@app/reducers/user';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

interface PostRowProps {
    post: Post;
}

const mapStateToProps = (
    state: AppState,
    ownProps: PostRowProps
): Partial<PostRowComponent.Props> => {
    const owner = state.users.users.get(ownProps.post.owner);
    return {
        post: ownProps.post,
        postOwner: owner,
        loggedInUser: state.users.loggedInUser,
        canDeletePost: PermissionsManager.canDeletePost(
            state.users,
            state.users.loggedInUser || '',
            ownProps.post
        )
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<PostRowComponent.Props> => {
    return {
        actions: bindActionCreators({ ...omit(PostActions, 'Type') }, dispatch)
    };
};

const PostRow = connect(
    mapStateToProps,
    mapDispatchToProps
)(PostRowComponent as any);

export default (withRouter(PostRow as any) as any) as React.ComponentClass<PostRowProps>;
