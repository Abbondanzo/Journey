import 'package:journey/models/lat_lng.dart';
import 'package:test/test.dart';

void main() {
  group('LatLng', () {
    group('hashCode', () {
      test('if two equal models, return the same hashCode', () {
        final latLng1 = LatLng(1, 2);
        final latLng2 = LatLng(1, 2);
        expect(latLng1.hashCode, equals(latLng2.hashCode));
      });

      test('if two models with different values, return different hashCode',
          () {
        final latLng1 = LatLng(1, 2);
        final latLng2 = LatLng(2, 3);
        expect(latLng1.hashCode, isNot(equals(latLng2.hashCode)));
      });

      test('if two models with inverted values, return different hashCode', () {
        final latLng1 = LatLng(1, 2);
        final latLng2 = LatLng(2, 1);
        expect(latLng1.hashCode, isNot(equals(latLng2.hashCode)));
      });
    });

    group('==', () {
      test('if two equal models, returns true', () {
        final latLng1 = LatLng(1, 2);
        final latLng2 = LatLng(1, 2);
        expect(latLng1 == latLng2, isTrue);
        expect(latLng2 == latLng1, isTrue);
      });

      test('if two models with different values, returns false', () {
        final latLng1 = LatLng(1, 2);
        final latLng2 = LatLng(2, 3);
        expect(latLng1 == latLng2, isFalse);
        expect(latLng2 == latLng1, isFalse);
      });

      test('if two models with inverted values, return false', () {
        final latLng1 = LatLng(1, 2);
        final latLng2 = LatLng(2, 1);
        expect(latLng1 == latLng2, isFalse);
        expect(latLng2 == latLng1, isFalse);
      });
    });

    group('toString', () {
      test('returns string with all values', () {
        final latLng = LatLng(1, 2);
        final expectedString = 'LatLng{latitude: 1.0, longitude: 2.0}';
        expect(latLng.toString(), equals(expectedString));
      });
    });
  });
}
