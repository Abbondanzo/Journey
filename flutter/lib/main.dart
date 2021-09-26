import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

import 'providers/entries.dart';
import 'providers/user.dart';
import 'routes.dart';
import 'screens/add_entry_screen.dart';
import 'screens/home_screen.dart';

class JourneyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Journey",
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

Future<void> main() async {
  EquatableConfig.stringify = true;
  WidgetsFlutterBinding.ensureInitialized();
  runApp(withUserProvider(withEntriesProvider(JourneyApp())));
}
