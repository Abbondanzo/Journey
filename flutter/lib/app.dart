import 'package:flutter/material.dart';

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
