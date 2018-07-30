import { UserActions } from '@app/actions';
import { LoginPage } from '@app/components';
import { AppState } from '@app/reducers';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<LoginPage.Props> => {
    return {};
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<LoginPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(UserActions, 'Type') }, dispatch)
    };
};

export default (connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginPage) as any) as React.StatelessComponent;
