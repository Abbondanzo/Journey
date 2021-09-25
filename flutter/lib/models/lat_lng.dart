import 'package:equatable/equatable.dart';
import 'package:meta/meta.dart';

@immutable
class LatLng extends Equatable {
  final double latitude;
  final double longitude;

  LatLng(this.latitude, this.longitude);

  // ignore: non_constant_identifier_names
  static final UNKNOWN = LatLng(-1, -1);

  @override
  int get hashCode => latitude.hashCode ^ (longitude.hashCode * 1000);

  @override
  List<Object?> get props => [latitude, longitude];
}
