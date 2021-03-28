import { HomePage } from '@app/components/root/HomePage';
import { UserRole } from '@app/models';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<HomePage.Props> => {
    const loggedInUser = getUserById(state.users.loggedInUser, state.users);
    const posts = state.posts.posts.filter((post) => {
        if (
            !loggedInUser ||
            (loggedInUser &&
                (loggedInUser.profileDetails.role === UserRole.MODERATOR ||
                    loggedInUser.profileDetails.role === UserRole.ADMINISTRATOR))
        ) {
            return true;
        } else {
            return (
                loggedInUser.profileDetails.following.indexOf(post.owner) !== -1 ||
                loggedInUser.uid === post.owner
            );
        }
    });
    return {
        posts
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<HomePage.Props> => {
    return {};
};

const Home = connect(
    mapStateToProps,
    mapDispatchToProps
)(HomePage);

export default (withRouter(Home as any) as any) as React.StatelessComponent;
