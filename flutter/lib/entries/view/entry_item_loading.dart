import 'package:flutter/material.dart';
import 'package:journey/widgets/loading/loading_text.dart';

class EntryItemLoading extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        LoadingText(
          key: Key('loading__title'),
          width: 250,
          height: 24,
        ),
        LoadingText(
          key: Key('loading__subtitle'),
          width: 150,
          height: 16,
        )
      ],
    );
  }
}
