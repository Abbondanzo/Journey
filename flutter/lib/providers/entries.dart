import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/blocs/entries/entries.dart';
import 'package:journey/persistence/database_provider.dart';
import 'package:journey/persistence/entry/entry_database_repository.dart';

Widget withEntriesProvider(Widget child) {
  final provider = DatabaseProvider.get;
  final repository = EntryDatabaseRepository(provider);
  return BlocProvider<EntriesBloc>(
    create: (context) {
      return EntriesBloc(entryRepository: repository)..add(LoadEntries());
    },
    child: child,
  );
}
