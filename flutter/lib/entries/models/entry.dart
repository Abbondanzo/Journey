import 'package:equatable/equatable.dart';
import 'package:journey/entries/entries.dart';
import 'package:journey/models/uuid.dart';
import 'package:meta/meta.dart';

@immutable
class LatLng extends Equatable {
  final double latitude;
  final double longitude;

  const LatLng(this.latitude, this.longitude);

  static const UNKNOWN = LatLng(-1, -1);

  @override
  int get hashCode => latitude.hashCode ^ (longitude.hashCode * 1000);

  @override
  List<Object?> get props => [latitude, longitude];
}

@immutable
class Location extends Equatable {
  final String city;
  final String country;
  final LatLng latLng;

  const Location(this.city, this.country, this.latLng);

  static const UNKNOWN = Location('', '', LatLng.UNKNOWN);

  @override
  List<Object?> get props => [city, country, latLng];

  /// Returns a formal `city, country` string for displaying this location in a
  /// human-readable format.
  String formattedLocation() {
    return '$city, $country';
  }
}

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
