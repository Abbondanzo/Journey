import 'package:flutter/material.dart';

class LoadingText extends StatelessWidget {
  final double width;
  final double height;

  const LoadingText(
      {required Key key, required this.width, required this.height})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }
}
