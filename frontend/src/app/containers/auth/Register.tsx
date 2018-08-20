import { UserActions } from '@app/actions';
import { RegisterPage } from '@app/components/auth/RegisterPage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<RegisterPage.Props> => {
    return {
        loggedInUser: getUserById(state.users.loggedInUser, state.users)
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<RegisterPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(UserActions, 'Type') }, dispatch)
    };
};

const Register = connect(
    mapStateToProps,
    mapDispatchToProps
)(RegisterPage);

export default (withRouter(Register as any) as any) as React.StatelessComponent;
