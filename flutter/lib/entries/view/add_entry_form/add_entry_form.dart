import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/entries/entries.dart';

class AddEntryForm extends StatefulWidget {
  @override
  AddEntryFormState createState() {
    return AddEntryFormState();
  }
}

class AddEntryFormState extends State<AddEntryForm> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();

  // Default to disabled since typing in one field validates the rest
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      autovalidateMode: _autovalidateMode,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Title *',
              hintText: 'Where did you go?',
            ),
            controller: _titleController,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a title';
              }
              return null;
            },
          ),
          SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(
              labelText: 'Body',
              hintText: 'Tell us about your journey',
            ),
            controller: _bodyController,
            keyboardType: TextInputType.name,
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                final entry = Entry(
                    title: _titleController.text,
                    body: _bodyController.text,
                    location: Location('city', 'country', LatLng(1, 2)));
                context.read<EntriesBloc>().add(AddEntry(entry));
              } else {
                setState(() {
                  _autovalidateMode = AutovalidateMode.onUserInteraction;
                });
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}
