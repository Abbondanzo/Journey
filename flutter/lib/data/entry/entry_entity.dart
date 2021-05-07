import '../location/location_entity.dart';

class EntryEntity {
  final String id;
  final String title;
  final String body;
  final DateTime dateTime;
  final LocationEntity location;

  EntryEntity(this.id, this.title, this.body, this.dateTime, this.location);

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
      other is EntryEntity &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          title == other.title &&
          body == other.body &&
          dateTime == other.dateTime &&
          location == other.location;

  Map<String, Object> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'dateTime': dateTime.toIso8601String(),
      'location': location.toJson()
    };
  }

  @override
  String toString() {
    return 'EntryEntity{id: $id, title: $title, body: $body, dateTime: $dateTime, location: $location}';
  }

  static EntryEntity fromJson(Map<String, Object> json) {
    return EntryEntity(
        json['id'] as String,
        json['title'] as String,
        json['body'] as String,
        DateTime.parse(json['dateTime']),
        LocationEntity.fromJson(json['location']));
  }
}
