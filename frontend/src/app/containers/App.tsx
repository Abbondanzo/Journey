import { PostActions, UserActions } from '@app/actions';
import { UtilActions } from '@app/actions/util';
import { AppPage } from '@app/components/root/AppPage';
import { AppState } from '@app/reducers';
import { getUserById } from '@app/reducers/user';
import { omit } from '@app/utils';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<AppPage.Props> => {
    return {
        loggedInUser: getUserById(state.users.loggedInUser, state.users),
        successMessage: state.utils.successMessage,
        errorMessage: state.utils.errorMessage,
        loading: state.utils.isLoading
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<AppPage.Props> => {
    return {
        actions: bindActionCreators(
            {
                ...omit(PostActions, 'Type'),
                ...omit(UserActions, 'Type'),
                ...omit(UtilActions, 'Type')
            },
            dispatch
        )
    };
};

export default (connect(
    mapStateToProps,
    mapDispatchToProps
)(AppPage) as any) as React.StatelessComponent;
