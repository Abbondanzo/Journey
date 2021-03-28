import { UtilActions } from '@app/actions/util';
import { MapContainerPage } from '@app/components/dashboard/MapContainerPage';
import { AppState } from '@app/reducers';
import { omit } from '@app/utils';
import { withGoogleMap, withScriptjs } from 'react-google-maps';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

interface MapContainerProps
    extends Pick<MapContainerPage.Props, 'loadingElement'>,
        Pick<MapContainerPage.Props, 'containerElement'>,
        Pick<MapContainerPage.Props, 'mapElement'> {}

const mapStateToProps = (state: AppState): Partial<MapContainerPage.Props> => {
    return {
        posts: state.posts.posts,
        googleMapURL: state.utils.googleMapURL
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<MapContainerPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(UtilActions, 'Type') }, dispatch)
    };
};

const ContainerPage = withScriptjs(withGoogleMap(MapContainerPage)) as any;

const MapContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ContainerPage);

export default MapContainer as React.ComponentClass<MapContainerProps>;
