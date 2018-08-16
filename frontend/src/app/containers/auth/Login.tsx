import { UserActions } from '@app/actions';
import { LoginPage } from '@app/components/auth/LoginPage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<LoginPage.Props> => {
    return {
        loggedInUser: getUserById(state.users.loggedInUser, state.users)
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<LoginPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(UserActions, 'Type') }, dispatch)
    };
};

const Login = connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginPage);

export default (withRouter(Login as any) as any) as React.StatelessComponent;
