import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/authentication/repositories/user_repository.dart';

part 'user_event.dart';
part 'user_state.dart';

class UserBloc extends Bloc<UserEvent, UserState> {
  final UserRepository userRepository;

  UserBloc({required this.userRepository}) : super(UserLoading());

  @override
  Stream<UserState> mapEventToState(UserEvent event) async* {
    if (event is LoadUser) {
      yield* _mapLoadUserToState();
    } else if (event is RemoveUser) {
      yield* _mapRemoveUserToState();
    } else if (event is SetUser) {
      yield* _mapSetUserToState(event);
    }
  }

  Stream<UserState> _mapLoadUserToState() async* {
    try {
      final user = await userRepository.getUser();
      yield UserLoaded(user);
    } catch (e) {
      yield UserNotLoaded(e as Exception);
    }
  }

  Stream<UserState> _mapRemoveUserToState() async* {
    yield UserLoaded(null);

    if (state is UserLoaded) {
      // Only perform remove on loaded state if a user exists
      if ((state as UserLoaded).user != null) {
        await userRepository.removeUser();
      }
    } else {
      await userRepository.removeUser();
    }
  }

  Stream<UserState> _mapSetUserToState(SetUser event) async* {
    yield UserLoaded(event.user);
    await userRepository.setUser(event.user);
  }
}
