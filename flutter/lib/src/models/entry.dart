import 'package:meta/meta.dart';

import 'location.dart';
import 'uuid.dart';

@immutable
class Entry {
  final String id;
  final String title;
  final String body;
  final DateTime dateTime;
  final Location location;

  Entry(this.title, this.body, this.location, {String id, DateTime dateTime})
      : id = id ?? Uuid().generateV4(),
        dateTime = dateTime ?? DateTime.now();
}
