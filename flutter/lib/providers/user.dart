import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/blocs/user/user_bloc.dart';
import 'package:journey/blocs/user/user_event.dart';
import 'package:journey/persistence/user/user_preferences_repository.dart';

Widget withUserProvider(Widget child) {
  final userRepository = UserPreferencesRepository();
  return BlocProvider<UserBloc>(
    create: (context) {
      return UserBloc(userRepository: userRepository)..add(LoadUser());
    },
    child: child,
  );
}
