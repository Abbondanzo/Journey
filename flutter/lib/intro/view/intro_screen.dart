import 'package:flutter/material.dart';

import './sign_up_screen.dart';

class IntroScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Container(
            alignment: Alignment.center,
            color: Theme.of(context).colorScheme.primary,
            child:
                Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 24.0),
                child: const Text("Journey",
                    style: TextStyle(
                      color: Color(0xFFFFFFFF),
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    )),
              ),
              TextButton(
                  onPressed: () => {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) {
                            return SignUpScreen();
                          }),
                        )
                      },
                  style: TextButton.styleFrom(
                      backgroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(horizontal: 24.0),
                      shape: const StadiumBorder()),
                  child: const Text("Continue",
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)))
            ])));
  }
}
