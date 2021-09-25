import 'package:journey/models/entry.dart';
import 'package:journey/models/lat_lng.dart';
import 'package:journey/models/location.dart';
import 'package:journey/persistence/dao.dart';

class EntryDao extends Dao<Entry> {
  final tableName = 'entries';

  final columnId = 'id';
  final _columnTitle = 'title';
  final _columnBody = 'body';
  final _columnDateTime = 'dateTime';
  final _columnLocation = 'location';

  final _locationCity = 'city';
  final _locationCountry = 'country';
  final _locationLatitude = 'latitude';
  final _locationLongitude = 'longitude';

  @override
  String get createTableQuery => "CREATE TABLE $tableName("
      "$columnId TEXT PRIMARY KEY,"
      "$_columnTitle TEXT,"
      "$_columnBody TEXT,"
      "$_columnDateTime TEXT,"
      "$_columnLocation TEXT)";

  @override
  Entry fromMap(Map<String, dynamic> query) {
    return Entry(
        query[columnId],
        query[_columnTitle] as String,
        query[_columnBody] as String,
        DateTime.parse(query[_columnDateTime]),
        _fromLocationMap(query[_columnLocation]));
  }

  @override
  Map<String, dynamic> toMap(Entry object) {
    return {
      columnId: object.id,
      _columnTitle: object.title,
      _columnBody: object.body,
      _columnDateTime: object.dateTime.toIso8601String(),
      _columnLocation: _toLocationMap(object.location)
    };
  }

  Location _fromLocationMap(Map<String, dynamic> query) {
    return Location(query[_locationCity], query[_locationCountry],
        LatLng(query[_locationLatitude], query[_locationLongitude]));
  }

  Map<String, dynamic> _toLocationMap(Location location) {
    return {
      _locationCity: location.city,
      _locationCountry: location.country,
      _locationLatitude: location.latLng.latitude,
      _locationLongitude: location.latLng.longitude
    };
  }
}
