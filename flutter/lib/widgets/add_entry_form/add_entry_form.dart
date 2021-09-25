import 'package:flutter/material.dart';

class AddEntryForm extends StatefulWidget {
  @override
  AddEntryFormState createState() {
    return AddEntryFormState();
  }
}

class AddEntryFormState extends State<AddEntryForm> {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 16),
          child: TextField(
            decoration: InputDecoration(
              border: OutlineInputBorder(),
              focusedBorder: OutlineInputBorder(),
              labelText: "Title",
              hintText: "Where did you go?",
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 16),
          child: TextFormField(
            decoration: InputDecoration(
              border: OutlineInputBorder(),
              focusedBorder: OutlineInputBorder(),
              labelText: "Body",
              hintText: "Tell us about your journey",
            ),
          ),
        ),
      ],
    );
  }
}
