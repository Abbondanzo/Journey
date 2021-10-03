import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/entries/entries.dart';

class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
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
            ElevatedButton(
              child: const Text('Logout'),
              onPressed: () {
                context.read<UserBloc>().add(RemoveUser());
              },
            ),
            Expanded(child: EntriesList()),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) {
              return AddEntryScreen();
            }),
          );
        },
        child: Icon(Icons.add),
        tooltip: "Add Entry",
      ),
    );
  }
}
