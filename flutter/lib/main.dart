import 'package:flutter/material.dart';
import 'package:journey/persistence/database_provider.dart';
import 'package:journey/persistence/entry/entry_database_repository.dart';
import 'package:journey/run_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final provider = DatabaseProvider.get;
  runBlocApp(EntryDatabaseRepository(provider));
}
