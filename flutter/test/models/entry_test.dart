import 'package:journey/models/entry.dart';
import 'package:journey/models/lat_lng.dart';
import 'package:journey/models/location.dart';
import 'package:test/test.dart';

void main() {
  group('Entry', () {
    group('hashCode', () {
      test('if two equal entries, return the same hashCode', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry('id', 'title', 'body', dateTime, location);
        final entry2 = Entry('id', 'title', 'body', dateTime, location);
        expect(entry1.hashCode, equals(entry2.hashCode));
      });

      test('if two entries with different values, return different hashCode',
          () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry('id1', 'title', 'body', dateTime, location);
        final entry2 = Entry('id2', 'title', 'body', dateTime, location);
        expect(entry1.hashCode, isNot(equals(entry2.hashCode)));
      });

      test('if two entries with inverted values, return the same hashCode', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry('id', 'title', 'body', dateTime, location);
        final entry2 = Entry('title', 'id', 'body', dateTime, location);
        expect(entry1.hashCode, (equals(entry2.hashCode)));
      });
    });

    group('==', () {
      test('if two equal entries, returns true', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry('id', 'title', 'body', dateTime, location);
        final entry2 = Entry('id', 'title', 'body', dateTime, location);
        expect(entry1 == entry2, isTrue);
        expect(entry2 == entry1, isTrue);
      });

      test('if two entries with different values, return false', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry('id1', 'title', 'body', dateTime, location);
        final entry2 = Entry('id2', 'title', 'body', dateTime, location);
        expect(entry1 == entry2, isFalse);
        expect(entry2 == entry1, isFalse);
      });

      test('if two entries with inverted values, return false', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry('id', 'title', 'body', dateTime, location);
        final entry2 = Entry('title', 'id', 'body', dateTime, location);
        expect(entry1 == entry2, isFalse);
        expect(entry2 == entry1, isFalse);
      });
    });

    group('toString', () {
      test('returns string with all values', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime(2021, 5, 21, 6);
        final entry = Entry('id', 'title', 'body', dateTime, location);
        final expectedString = 'Entry{id: id, title: title, body: body, '
            'dateTime: 2021-05-21 06:00:00.000, '
            'location: Location{city: city, country: country, '
            'latLng: LatLng{latitude: 1.0, longitude: 2.0}}}';
        expect(entry.toString(), equals(expectedString));
      });
    });
  });
}
