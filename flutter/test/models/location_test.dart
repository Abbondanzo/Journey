import 'package:journey/models/lat_lng.dart';
import 'package:journey/models/location.dart';
import 'package:test/test.dart';

void main() {
  group('Location', () {
    group('hashCode', () {
      test('if two equal models, return the same hashCode', () {
        final location1 = Location('city', 'country', LatLng(1, 2));
        final location2 = Location('city', 'country', LatLng(1, 2));
        expect(location1.hashCode, equals(location2.hashCode));
      });

      test('if two models with different values, return different hashCode',
          () {
        final location1 = Location('city', 'country', LatLng(1, 2));
        final location2 = Location('other city', 'country', LatLng(1, 2));
        expect(location1.hashCode, isNot(equals(location2.hashCode)));
      });

      test('if two models with inverted values, return same hashCode', () {
        final location1 = Location('city', 'country', LatLng(1, 2));
        final location2 = Location('country', 'city', LatLng(1, 2));
        expect(location1.hashCode, equals(location2.hashCode));
      });
    });

    group('==', () {
      test('if two equal models, returns true', () {
        final location1 = Location('city', 'country', LatLng(1, 2));
        final location2 = Location('city', 'country', LatLng(1, 2));
        expect(location1 == location2, isTrue);
        expect(location2 == location1, isTrue);
      });

      test('if two models with different values, returns false', () {
        final location1 = Location('city', 'country', LatLng(1, 2));
        final location2 = Location('other city', 'country', LatLng(1, 2));
        expect(location1 == location2, isFalse);
        expect(location2 == location1, isFalse);
      });

      test('if two models with inverted values, return false', () {
        final location1 = Location('city', 'country', LatLng(1, 2));
        final location2 = Location('country', 'city', LatLng(1, 2));
        expect(location1 == location2, isFalse);
        expect(location2 == location1, isFalse);
      });
    });

    group('toString', () {
      test('returns string with all values', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final expectedString = 'Location{city: city, country: country, '
            'latLng: LatLng{latitude: 1.0, longitude: 2.0}}';
        expect(location.toString(), equals(expectedString));
      });
    });
  });
}
