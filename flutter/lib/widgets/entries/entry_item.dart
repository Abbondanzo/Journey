import 'package:flutter/material.dart';
import 'package:journey/models/entry.dart';

class EntryItem extends StatelessWidget {
  final Entry entry;
  final GestureTapCallback onTap;

  EntryItem({Key key, @required this.entry, @required this.onTap})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(entry.title, key: Key('${entry.id}__title')),
      subtitle: Text(entry.location.formattedLocation(),
          key: Key('${entry.id}__subtitle')),
    );
  }
}
