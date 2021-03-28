import { UserActions } from '@app/actions';
import { AdminPage } from '@app/components/auth/AdminPage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<AdminPage.Props> => {
    return {
        loggedInUser: getUserById(state.users.loggedInUser, state.users),
        users: Array.from(state.users.users.values()),
        isLoading: state.utils.isLoading
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<AdminPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(UserActions, 'Type') }, dispatch)
    };
};

const Admin = connect(
    mapStateToProps,
    mapDispatchToProps
)(AdminPage);

export default (withRouter(Admin as any) as any) as React.StatelessComponent;
