import { PostActions, UserActions } from '@app/actions';
import { ProfilePage } from '@app/components/auth/ProfilePage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (
    state: AppState,
    ownProps: ProfilePage.Props
): Partial<ProfilePage.Props> => {
    const userId = ownProps.match.params.userId || state.users.loggedInUser;
    const loggedInUser = getUserById(state.users.loggedInUser, state.users);
    const userProfile = getUserById(userId, state.users);
    const posts = state.posts.posts.filter((post) => {
        return userProfile && post.owner === userProfile.uid;
    });
    return {
        loggedInUser,
        userProfile,
        isLoading: state.utils.isLoading,
        posts
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<ProfilePage.Props> => {
    return {
        actions: bindActionCreators(
            { ...omit(UserActions, 'Type'), ...omit(PostActions, 'Type') },
            dispatch
        )
    };
};

// getProfileImage = () => {

// }

const Profile = connect(
    mapStateToProps,
    mapDispatchToProps
)(ProfilePage);

export default (withRouter(Profile as any) as any) as React.StatelessComponent;
