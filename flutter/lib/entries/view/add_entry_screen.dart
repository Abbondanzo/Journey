import 'package:flutter/material.dart';

import './add_entry_form/add_entry_form.dart';

class AddEntryScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Add Entry"),
      ),
      body: Padding(padding: const EdgeInsets.all(16), child: AddEntryForm()),
    );
  }
}
