class LatLng {
  double latitude;
  double longitude;

  LatLng(this.latitude, this.longitude);

  // ignore: non_constant_identifier_names
  static final UNKNOWN = LatLng(-1, -1);

  @override
  int get hashCode => latitude.hashCode ^ longitude.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LatLng &&
          runtimeType == other.runtimeType &&
          latitude == other.latitude &&
          longitude == other.longitude;

  @override
  String toString() {
    return 'LatLng{latitude: $latitude, longitude: $longitude}';
  }
}
