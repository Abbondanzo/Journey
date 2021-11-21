import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/authentication/repositories/user_repository.dart';

part 'user_event.dart';
part 'user_state.dart';

class UserBloc extends Bloc<UserEvent, UserState> {
  final UserRepository userRepository;

  UserBloc({required this.userRepository}) : super(UserLoading()) {
    on<LoadUser>(_onLoadUser);
    on<RemoveUser>(_onRemoveUser);
    on<SetUser>(_onSetUser);
  }

  void _onLoadUser(LoadUser event, Emitter<UserState> emit) async {
    try {
      final user = await userRepository.getUser();
      emit(UserLoaded(user));
    } catch (e) {
      emit(UserNotLoaded(e as Exception));
    }
  }

  void _onRemoveUser(RemoveUser event, Emitter<UserState> emit) async {
    emit(UserLoaded(null));

    if (state is UserLoaded) {
      // Only perform remove on loaded state if a user exists
      if ((state as UserLoaded).user != null) {
        await userRepository.removeUser();
      }
    } else {
      await userRepository.removeUser();
    }
  }

  void _onSetUser(SetUser event, Emitter<UserState> emit) async {
    emit(UserLoaded(event.user));
    await userRepository.setUser(event.user);
  }
}
