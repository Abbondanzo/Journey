import { SearchBoxPage } from '@app/components/dashboard/SearchBoxPage';
import { AppState } from '@app/reducers';
import { withGoogleMap, withScriptjs } from 'react-google-maps';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

interface SearchBoxProps
    extends Pick<SearchBoxPage.Props, 'loadingElement'>,
        Pick<SearchBoxPage.Props, 'containerElement'>,
        Pick<SearchBoxPage.Props, 'mapElement'>,
        Pick<SearchBoxPage.Props, 'id'>,
        Pick<SearchBoxPage.Props, 'onPlacesChanged'> {}

const mapStateToProps = (state: AppState): Partial<SearchBoxPage.Props> => {
    return {
        googleMapURL: state.utils.googleMapURL
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<SearchBoxPage.Props> => {
    return {};
};

const BoxPage = withScriptjs(withGoogleMap(SearchBoxPage)) as any;

const SearchBox = connect(
    mapStateToProps,
    mapDispatchToProps
)(BoxPage);

export default SearchBox as React.ComponentClass<SearchBoxProps>;
