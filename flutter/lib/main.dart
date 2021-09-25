import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:journey/persistence/database_provider.dart';
import 'package:journey/persistence/entry/entry_database_repository.dart';
import 'package:journey/run_app.dart';

Future<void> main() async {
  EquatableConfig.stringify = true;
  WidgetsFlutterBinding.ensureInitialized();
  final provider = DatabaseProvider.get;
  runBlocApp(EntryDatabaseRepository(provider));
}
