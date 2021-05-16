import 'package:journey/models/entry.dart';
import 'package:journey/models/lat_lng.dart';
import 'package:journey/models/location.dart';
import 'package:journey/repositories/entry_repository.dart';

class MockRepository implements EntryRepository {
  @override
  Future<List<Entry>> getEntries() async {
    return List.of([
      Entry(
          "48d41b3b-1a2c-403e-a5f6-0598fcfee150",
          "Over the River and Thru the Woods",
          "Random entry body",
          DateTime(2021, 1, 21),
          Location("Quito", "Ecuador", LatLng(-1, -1))),
      Entry(
          "90c77747-1e2f-416d-b045-f84abca08235",
          "Rise and Shine",
          "Random entry body",
          DateTime(2019, 7, 10),
          Location("Paris", "France", LatLng(-1, -1))),
      Entry(
          "fbc1c0f8-15a8-4b1a-828b-f18b792cbeb9",
          "Two's a Crowd",
          "Random entry body",
          DateTime(2018, 3, 14),
          Location("Melbourne", "Australia", LatLng(-1, -1))),
      Entry(
          "44e1f4da-150e-4907-aa71-06ea39272771",
          "Swift is Not Reactive",
          "Random entry body",
          DateTime(2018, 1, 1),
          Location("Boston", "Massachusetts", LatLng(-1, -1))),
      Entry(
          "24835fde-6537-4c43-90e4-05ab29c8f231",
          "The Answer to Life, the Universe, and Everything is 42",
          "Random entry body",
          DateTime(2015, 6, 22),
          Location("Hilo", "Hawaii", LatLng(-1, -1)))
    ]);
  }

  @override
  Future<Entry> insert(Entry entry) {
    // TODO: implement insert
    throw UnimplementedError();
  }

  @override
  Future<Entry> update(Entry entry) {
    // TODO: implement update
    throw UnimplementedError();
  }

  @override
  Future<Entry> delete(Entry entry) {
    // TODO: implement delete
    throw UnimplementedError();
  }
}
