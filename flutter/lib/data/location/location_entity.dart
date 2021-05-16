class LocationEntity {
  final String city;
  final String country;
  final double latitude;
  final double longitude;

  LocationEntity(this.city, this.country, this.latitude, this.longitude);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LocationEntity &&
          runtimeType == other.runtimeType &&
          city == other.city &&
          country == other.country &&
          latitude == other.latitude &&
          longitude == other.longitude;

  @override
  int get hashCode =>
      city.hashCode ^ country.hashCode ^ latitude.hashCode ^ longitude.hashCode;

  @override
  String toString() {
    return 'LocationEntity{city: $city, country: $country, latitude: $latitude, longitude: $longitude';
  }

  Map<String, Object> toJson() {
    return {
      'city': city,
      'country': country,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  static LocationEntity fromJson(Map<String, Object> json) {
    return LocationEntity(json['city'] as String, json['country'] as String,
        json['latitude'] as double, json['longitude'] as double);
  }
}
