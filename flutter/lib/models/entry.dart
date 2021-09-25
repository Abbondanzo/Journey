import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';

import 'location.dart';
import 'uuid.dart';

@immutable
class Entry extends Equatable {
  final String id;
  final String title;
  final String body;
  final DateTime dateTime;
  final Location location;

  Entry(this.id, this.title, this.body, this.dateTime, this.location);

  Entry.asNew(this.title, this.body, this.location,
      {String? id, DateTime? dateTime})
      : id = id ?? Uuid().generateV4(),
        dateTime = dateTime ?? DateTime.now();

  @override
  List<Object?> get props => [id, title, body, dateTime, location];
}
