import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';

class DashboardName extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<UserBloc, UserState>(builder: (context, state) {
      final user = state is UserLoaded ? state.user : null;
      final name = user != null ? '${user.firstName} ${user.lastName}' : 'User';
      return Column(children: [
        Text(
          name,
          style: Theme.of(context).textTheme.subtitle1?.merge(
              TextStyle(color: Colors.white, fontWeight: FontWeight.w300)),
        ),
        Text(
          'Morristown, NJ',
          style: Theme.of(context).textTheme.subtitle2?.merge(
              TextStyle(color: Colors.white70, fontWeight: FontWeight.w300)),
        )
      ]);
    });
  }
}
