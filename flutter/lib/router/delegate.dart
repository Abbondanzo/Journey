import 'package:flutter/material.dart';

import 'path.dart';

class AppRouterDelegate extends RouterDelegate<AppPath>
    with ChangeNotifier, PopNavigatorRouterDelegateMixin<AppPath> {
  final GlobalKey<NavigatorState> navigatorKey;

  bool _show404 = false;
  bool get show404 => _show404;
  set show404(bool value) {
    _show404 = value;
    notifyListeners();
  }

  AppRouterDelegate() : navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return Navigator(
      key: navigatorKey,
      pages: [
        // MaterialPage(
        //   key: ValueKey('BooksListPage'),
        //   child: BooksListScreen(
        //     books: books,
        //     onTapped: _handleBookTapped,
        //   ),
        // ),
        // if (show404)
        //   MaterialPage(key: ValueKey('UnknownPage'), child: UnknownScreen())
        // else if (_selectedBook != null)
        //   BookDetailsPage(book: _selectedBook)
      ],
      onPopPage: (route, result) {
        if (!route.didPop(result)) {
          return false;
        }

        show404 = false;
        notifyListeners();

        return true;
      },
    );
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
