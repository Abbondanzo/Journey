import { PostActions, UserActions } from '@app/actions';
import { ProfilePage } from '@app/components/auth/ProfilePage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<ProfilePage.Props> => {
    const loggedInUser = getUserById(state.users.loggedInUser, state.users);
    const posts = state.posts.posts.filter((post) => {
        return loggedInUser && post.owner === loggedInUser.uid;
    });
    console.log(loggedInUser);
    return {
        loggedInUser,
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
