import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/dashboard/dashboard.dart';
import 'package:journey/intro/intro.dart';
import 'package:journey/splash/splash.dart';

import 'path.dart';

class AppRouterDelegate extends RouterDelegate<AppPath>
    with ChangeNotifier, PopNavigatorRouterDelegateMixin<AppPath> {
  final GlobalKey<NavigatorState> _navigatorKey;
  final UserRepository _userRepository;

  bool _show404 = false;
  bool get show404 => _show404;
  set show404(bool value) {
    _show404 = value;
    notifyListeners();
  }

  bool? _hasUser;
  bool? get hasUser => _hasUser;
  set hasUser(bool? value) {
    _hasUser = value;
    notifyListeners();
  }

  @override
  GlobalKey<NavigatorState> get navigatorKey => _navigatorKey;

  AppRouterDelegate(this._userRepository)
      : _navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    List<Page> stack;
    if (show404 == true) {
      stack = _unknownStack;
    } else if (hasUser == null) {
      stack = _splashStack;
    } else if (hasUser == true) {
      stack = _loggedInStack;
    } else {
      stack = _loggedOutStack;
    }

    return BlocListener<UserBloc, UserState>(
        listener: (context, state) {
          if (state is UserLoaded) {
            hasUser = state.user != null;
          } else {
            hasUser = null;
          }
        },
        child: Navigator(
          key: navigatorKey,
          pages: stack,
          onPopPage: (route, result) {
            if (!route.didPop(result)) {
              return false;
            }

            show404 = false;
            notifyListeners();

            return true;
          },
        ));
  }

  List<Page> get _splashStack =>
      [MaterialPage(key: ValueKey('SplashPage'), child: SplashScreen())];

  List<Page> get _unknownStack =>
      [MaterialPage(key: ValueKey('SplashPage'), child: SplashScreen())];

  List<Page> get _loggedOutStack =>
      [MaterialPage(key: ValueKey('IntroPage'), child: IntroScreen())];

  List<Page> get _loggedInStack {
    return [
      MaterialPage(
        key: ValueKey('DashboardPage'),
        child: DashboardScreen(),
      )
    ];
  }

  @override
  Future<void> setNewRoutePath(AppPath path) async {
    if (path is UnknownPath) {
      show404 = true;
      return;
    }

    show404 = false;
  }
}
