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
}
