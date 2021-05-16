import 'package:journey/models/entry.dart';
import 'package:journey/models/lat_lng.dart';
import 'package:journey/models/location.dart';
import 'package:journey/persistence/entry/entry_dao.dart';
import 'package:test/test.dart';

void main() {
  group('EntryDao', () {
    final location = Location('city', 'country', LatLng(1, 2));
    final dateTime = DateTime(2021, 5, 21, 6);
    final entry = Entry('id', 'title', 'body', dateTime, location);
    final map = {
      'id': 'id',
      'title': 'title',
      'body': 'body',
      'dateTime': '2021-05-21T06:00:00.000',
      'location': {
        'city': 'city',
        'country': 'country',
        'latitude': 1.0,
        'longitude': 2.0
      }
    };

    test('tableName returns entries', () {
      final dao = EntryDao();
      expect(dao.tableName, 'entries');
    });

    test('toMap creates a Map of all values', () {
      final dao = EntryDao();
      expect(dao.toMap(entry), equals(map));
    });

    test('fromMap creates an Entry with all values', () {
      final dao = EntryDao();
      expect(dao.fromMap(map), equals(entry));
    });

    test('createTableQuery returns SQL CREATE TABLE entry', () {
      final dao = EntryDao();
      final expectedQuery =
          'CREATE TABLE entries(id TEXT PRIMARY KEY,title TEXT,'
          'body TEXT,dateTime TEXT,location TEXT)';
      expect(dao.createTableQuery, equals(expectedQuery));
    });
  });
}
