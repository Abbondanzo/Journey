import 'package:flutter/material.dart';
import 'package:journey/router/delegate.dart';
import 'package:journey/router/information_parser.dart';

class _JourneyAppState extends State<JourneyApp> {
  AppRouterDelegate _routerDelegate = AppRouterDelegate();
  AppRouteInformationParser _routeInformationParser =
      AppRouteInformationParser();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Journey',
      theme: ThemeData(
        primaryColor: Colors.white,
      ),
      routerDelegate: _routerDelegate,
      routeInformationParser: _routeInformationParser,
    );
  }
}

class JourneyApp extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => _JourneyAppState();
}
