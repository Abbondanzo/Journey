import 'package:journey/data/entry/entry_entity.dart';
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

  Entry(this.id, this.title, this.body, this.dateTime, this.location);

  Entry(this.title, this.body, this.location, {String id, DateTime dateTime})
      : id = id ?? Uuid().generateV4(),
        dateTime = dateTime ?? DateTime.now();

  @override
  int get hashCode =>
      id.hashCode ^
      title.hashCode ^
      body.hashCode ^
      dateTime.hashCode ^
      location.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Entry &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          title == other.title &&
          body == other.body &&
          dateTime == other.dateTime &&
          location == other.location;

  @override
  String toString() {
    return 'Entry{id: $id, title: $title, body: $body, dateTime: $dateTime, location: $location}';
  }

  EntryEntity toEntity() {
    return EntryEntity(id, title, body, dateTime, location.toEntity());
  }

  static Entry fromEntity(EntryEntity entity) {
    return Entry(entity.id, entity.title, entity.body, entity.dateTime,
        Location.fromEntity(entity.location));
  }
}
