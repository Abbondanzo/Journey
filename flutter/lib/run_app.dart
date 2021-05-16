import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/blocs/entries/entries.dart';
import 'package:journey/repositories/entry_repository.dart';
import 'package:journey/widgets/entries/entries_list.dart';

void runBlocApp(EntryRepository repository) {
  BlocSupervisor.delegate = BlocDelegate();
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
      title: 'Startup Name Generator',
      home: Scaffold(
        appBar: AppBar(
          title: Text('Journey'),
        ),
        body: EntriesList(),
      ),
      theme: ThemeData(
        primaryColor: Colors.white,
      ),
    );
  }
}
