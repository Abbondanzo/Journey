import 'package:flutter/material.dart';
import 'package:journey/run_app.dart';
import 'package:journey/storage/mock_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runBlocApp(MockRepository());
}
