import 'package:flutter/material.dart';

import '../models/entry.dart';

class EntryItem extends StatelessWidget {
  final Entry entry;
  final GestureTapCallback onTap;

  EntryItem({required this.entry, required this.onTap})
      : super(key: Key(entry.id));

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(
        entry.title,
        key: Key('${entry.id}__title'),
        style: TextStyle(color: Color(0xFF727272)),
      ),
      subtitle: Text(entry.location.formattedLocation(),
          style: TextStyle(color: Color(0xFFB8B8B8)),
          key: Key('${entry.id}__subtitle')),
    );
    // return Scaffold(
    //     body: ListTile(
    //   onTap: onTap,
    //   title: Text(entry.title, key: Key('${entry.id}__title')),
    //   subtitle: Text(entry.location.formattedLocation(),
    //       key: Key('${entry.id}__subtitle')),
    // ));
  }
}
