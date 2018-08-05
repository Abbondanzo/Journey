import { MapContainerPage } from '@app/components/dashboard/MapContainerPage';
import { MapPage } from '@app/components/dashboard/MapPage';
import { AppState } from '@app/reducers';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<MapContainerPage.Props> => {
    return {};
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<MapContainerPage.Props> => {
    return {};
};

const Map = connect(
    mapStateToProps,
    mapDispatchToProps
)(MapPage);

export default (Map as any) as React.StatelessComponent;
