import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/entries/entries.dart';

class IntroScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Journey')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Builder(
              builder: (context) {
                final userId = context.select(
                  (UserBloc bloc) {
                    if (bloc.state is UserLoaded) {
                      return (bloc.state as UserLoaded).user?.id;
                    }
                  },
                );
                return Text('UserID: $userId');
              },
            ),
            EntriesList(),
            ElevatedButton(
              child: const Text('Logout'),
              onPressed: () {
                context.read<UserBloc>().add(RemoveUser());
              },
            ),
          ],
        ),
      ),
    );
  }
}
