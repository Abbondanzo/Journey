import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';

import 'lat_lng.dart';

@immutable
class Location extends Equatable {
  final String city;
  final String country;
  final LatLng latLng;

  Location(this.city, this.country, this.latLng);

  // ignore: non_constant_identifier_names
  static final UNKNOWN = Location('', '', LatLng.UNKNOWN);

  @override
  List<Object?> get props => [city, country, latLng];

  /// Returns a formal `city, country` string for displaying this location in a
  /// human-readable format.
  String formattedLocation() {
    return '$city, $country';
  }
}
