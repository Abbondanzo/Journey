import 'package:flutter/material.dart';

import './sign_up_form/sign_up_form.dart';

class SignUpScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Sign Up"),
      ),
      body: Padding(padding: const EdgeInsets.all(16), child: SignUpForm()),
    );
  }
}
