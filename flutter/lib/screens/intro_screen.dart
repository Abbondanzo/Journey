import 'package:flutter/material.dart';
import 'package:journey/widgets/add_entry_form/add_entry_form.dart';

class IntroScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Intro")),
      body: AddEntryForm(),
    );
  }
}
