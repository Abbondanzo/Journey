import 'package:flutter/material.dart';

class SignUpForm extends StatefulWidget {
  @override
  SignUpFormState createState() {
    return SignUpFormState();
  }
}

class SignUpFormState extends State<SignUpForm> {
  final _formKey = GlobalKey<FormState>();

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();

  // Default to disabled since typing in one field validates the rest
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
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
            autofocus: true,
            decoration: const InputDecoration(labelText: 'First Name'),
            controller: _firstNameController,
            keyboardType: TextInputType.name,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a first name';
              }
              return null;
            },
          ),
          SizedBox(height: 16),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Last Name'),
            controller: _lastNameController,
            keyboardType: TextInputType.name,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a last name';
              }
              return null;
            },
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                final from =
                    'From "${_firstNameController.text} ${_lastNameController.text}"';
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(from)),
                );
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
