import { MapPage } from '@app/components/dashboard/MapPage';
import { AppState } from '@app/reducers';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<MapPage.Props> => {
    return {};
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<MapPage.Props> => {
    return {};
};

const Map = connect(
    mapStateToProps,
    mapDispatchToProps
)(MapPage);

export default (withRouter(Map as any) as any) as React.StatelessComponent;
