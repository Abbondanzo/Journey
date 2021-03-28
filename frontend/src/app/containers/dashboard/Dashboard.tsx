import { PostActions } from '@app/actions';
import { MapPage } from '@app/components/dashboard/MapPage';
import { AppState } from '@app/reducers';
import { omit } from '@app/utils';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';

const mapStateToProps = (state: AppState): Partial<MapPage.Props> => {
    return {
        posts: state.posts.posts,
        googleMapsComponent: state.utils.googleMapComponent
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<MapPage.Props> => {
    return {
        actions: bindActionCreators({ ...omit(PostActions, 'Type') }, dispatch)
    };
};

const Map = connect(
    mapStateToProps,
    mapDispatchToProps
)(MapPage);

export default (withRouter(Map as any) as any) as React.StatelessComponent;
