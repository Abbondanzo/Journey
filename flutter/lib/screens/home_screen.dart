import 'package:flutter/material.dart';
import 'package:journey/routes.dart';
import 'package:journey/widgets/entries/entries_list.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Journey"),
      ),
      body: EntriesList(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, Routes.addEntry);
        },
        child: Icon(Icons.add),
        tooltip: "Add Entry",
      ),
    );
  }
}
