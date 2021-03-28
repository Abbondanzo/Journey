import { ProfileImageComponent } from '@app/components/util/ProfileImageComponent';
import { AppState } from '@app/reducers';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

const mapStateToProps = (
    state: AppState,
    ownProps: ProfileImageComponent.Props
): Partial<ProfileImageComponent.Props> => {
    return {
        userId: ownProps.userId,
        profileImages: state.users.userProfileImages
    };
};

const mapDispatchToProps = (dispatch: Dispatch): Partial<ProfileImageComponent.Props> => {
    return {};
};

const ProfileImage = connect(
    mapStateToProps,
    mapDispatchToProps
)(ProfileImageComponent);

export default (ProfileImage as any) as React.ComponentClass<
    PartialPick<ProfileImageComponent.Props, 'userId'>
>;
