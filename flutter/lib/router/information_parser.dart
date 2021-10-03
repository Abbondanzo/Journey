import 'package:flutter/material.dart';

import 'path.dart';

class AppRouteInformationParser extends RouteInformationParser<AppPath> {
  @override
  Future<AppPath> parseRouteInformation(
      RouteInformation routeInformation) async {
    // Handle nullable location
    final location = routeInformation.location;
    if (location == null) {
      return UnknownPath();
    }

    final uri = Uri.parse(location);
    // Handle '/'
    if (uri.pathSegments.length == 0) {
      return HomePath();
    }

    // Handle unknown routes
    return UnknownPath();
  }

  @override
  RouteInformation restoreRouteInformation(AppPath path) {
    if (path is UnknownPath) {
      return RouteInformation(location: '/404');
    }
    if (path is HomePath) {
      return RouteInformation(location: '/');
    }
    return RouteInformation();
  }
}
