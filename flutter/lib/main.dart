import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/entries/entries.dart';
import 'package:journey/persistence/database_provider.dart';

import 'app.dart';

Widget _withUserProvider(Widget child) {
  final userRepository = UserPreferencesRepository();
  return BlocProvider<UserBloc>(
    create: (context) {
      return UserBloc(userRepository: userRepository)..add(LoadUser());
    },
    child: child,
  );
}

Widget _withEntriesProvider(Widget child) {
  final provider = DatabaseProvider.get;
  final repository = EntryDatabaseRepository(provider);
  return BlocProvider<EntriesBloc>(
    create: (context) {
      return EntriesBloc(entryRepository: repository)..add(LoadEntries());
    },
    child: child,
  );
}

Future<void> main() async {
  // Static configuration
  EquatableConfig.stringify = true;

  // Binding and storage initialization
  WidgetsFlutterBinding.ensureInitialized();
  await DatabaseProvider.get.db();

  // Start the Flutter experience
  runApp(_withUserProvider(_withEntriesProvider(JourneyApp())));
}
