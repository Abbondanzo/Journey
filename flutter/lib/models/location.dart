import 'package:meta/meta.dart';

import 'lat_lng.dart';

@immutable
class Location {
  final String city;
  final String country;
  final LatLng latLng;

  Location(this.city, this.country, this.latLng);

  // ignore: non_constant_identifier_names
  static final UNKNOWN = Location('', '', LatLng.UNKNOWN);

  @override
  int get hashCode => city.hashCode ^ country.hashCode ^ latLng.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Location &&
          runtimeType == other.runtimeType &&
          city == other.city &&
          country == other.country &&
          latLng == other.latLng;

  @override
  String toString() {
    return 'Location{city: $city, country: $country, latLng: $latLng}';
  }

  /// Returns a formal `city, country` string for displaying this location in a
  /// human-readable format.
  String formattedLocation() {
    return '$city, $country';
  }
}
