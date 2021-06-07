import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/blocs/entries/entries.dart';
import 'package:journey/repositories/entry_repository.dart';
import 'package:journey/routes.dart';
import 'package:journey/screens/add_entry_screen.dart';
import 'package:journey/screens/home_screen.dart';

void runBlocApp(EntryRepository repository) {
  runApp(
    BlocProvider<EntriesBloc>(
      create: (context) {
        return EntriesBloc(entryRepository: repository)..add(LoadEntries());
      },
      child: JourneyApp(),
    ),
  );
}

class JourneyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Journey',
      initialRoute: Routes.home,
      routes: {
        Routes.home: (context) => HomeScreen(),
        Routes.addEntry: (context) => AddEntryScreen(),
      },
      theme: ThemeData(
        primaryColor: Colors.white,
      ),
    );
  }
}
