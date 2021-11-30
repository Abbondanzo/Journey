import 'package:flutter/material.dart';

class DashboardProfileImage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: CircleAvatar(
        backgroundColor: Colors.black,
        minRadius: 48.0,
        maxRadius: 48.0,
      ),
      decoration: new BoxDecoration(
        shape: BoxShape.circle,
        border: new Border.all(
          color: Colors.white,
          width: 3.0,
        ),
      ),
    );
  }
}
