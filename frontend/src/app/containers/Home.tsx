import { HomePage } from '@app/components/root/HomePage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<HomePage.Props> => {
    let posts = state.posts.posts;
    const loggedInUser = getUserById(state.users.loggedInUser, state.users);
    // Only filter if we're logged in
    if (loggedInUser) {
        posts = posts.filter((post) => {
            // Only include posts from followed or the owner
            loggedInUser.profileDetails.following.indexOf(post.owner) !== -1 ||
                loggedInUser.uid === post.owner;
        });
    }
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
