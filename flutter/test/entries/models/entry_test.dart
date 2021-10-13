import 'package:journey/entries/entries.dart';
import 'package:test/test.dart';

void main() {
  group('Entry', () {
    group('hashCode', () {
      test('if two equal entries, return the same hashCode', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final entry2 = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        expect(entry1.hashCode, equals(entry2.hashCode));
      });

      test('if two entries with different values, return different hashCode',
          () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry(
            id: 'id1',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final entry2 = Entry(
            id: 'id2',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        expect(entry1.hashCode, isNot(equals(entry2.hashCode)));
      });

      test('if two entries with inverted values, return different hashCode',
          () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final entry2 = Entry(
            id: 'title',
            title: 'id',
            body: 'body',
            dateTime: dateTime,
            location: location);
        expect(entry1.hashCode, isNot(equals(entry2.hashCode)));
      });
    });

    group('==', () {
      test('if two equal entries, returns true', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final entry2 = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        expect(entry1 == entry2, isTrue);
        expect(entry2 == entry1, isTrue);
      });

      test('if two entries with different values, return false', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry(
            id: 'id1',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final entry2 = Entry(
            id: 'id2',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        expect(entry1 == entry2, isFalse);
        expect(entry2 == entry1, isFalse);
      });

      test('if two entries with inverted values, return false', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime.now();
        final entry1 = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final entry2 = Entry(
            id: 'title',
            title: 'id',
            body: 'body',
            dateTime: dateTime,
            location: location);
        expect(entry1 == entry2, isFalse);
        expect(entry2 == entry1, isFalse);
      });
    });

    group('toString', () {
      test('returns string with all values', () {
        final location = Location('city', 'country', LatLng(1, 2));
        final dateTime = DateTime(2021, 5, 21, 6);
        final entry = Entry(
            id: 'id',
            title: 'title',
            body: 'body',
            dateTime: dateTime,
            location: location);
        final expectedString =
            'Entry(id, title, body, 2021-05-21 06:00:00.000, Location(city, country, LatLng(1.0, 2.0)))';
        expect(entry.toString(), equals(expectedString));
      });
    });
  });
}
