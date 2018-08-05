import { HomePage } from '@app/components/root/HomePage';
import { AppState } from '@app/reducers';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<HomePage.Props> => {
    return {};
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<HomePage.Props> => {
    return {};
};

const Home = connect(
    mapStateToProps,
    mapDispatchToProps
)(HomePage);

export default (withRouter(Home as any) as any) as React.StatelessComponent;
