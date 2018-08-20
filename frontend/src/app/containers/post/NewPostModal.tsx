import { PostActions } from '@app/actions';
import { NewPostModalPage } from '@app/components/post/NewPostModalPage';
import { AppState } from '@app/reducers';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<NewPostModalPage.Props> => {
    return {
        isShowing: state.posts.isAddingPost,
        loggedInUser: state.users.loggedInUser
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<NewPostModalPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(PostActions, 'Type') }, dispatch)
    };
};

const NewPostModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(NewPostModalPage);

export default (NewPostModal as any) as React.StatelessComponent;
