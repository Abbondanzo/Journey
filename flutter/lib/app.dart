import 'package:flutter/material.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/router/delegate.dart';
import 'package:journey/router/information_parser.dart';
import 'package:journey/theme.dart';

class _JourneyAppState extends State<JourneyApp> {
  final AppRouterDelegate _routerDelegate =
      AppRouterDelegate(UserPreferencesRepository());
  final AppRouteInformationParser _routeInformationParser =
      AppRouteInformationParser();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Journey',
      theme: purpleTheme,
      routerDelegate: _routerDelegate,
      routeInformationParser: _routeInformationParser,
    );
  }
}

class JourneyApp extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => _JourneyAppState();
}
