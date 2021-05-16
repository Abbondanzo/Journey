import 'package:journey/data/entry/entry_entity.dart';
import 'package:journey/data/entry/entry_repository.dart';
import 'package:journey/data/location/location_entity.dart';

class MockRepository implements EntryRepository {
  @override
  Future<List<EntryEntity>> loadEntries() async {
    return List.of([
      EntryEntity(
          "48d41b3b-1a2c-403e-a5f6-0598fcfee150",
          "Over the River and Thru the Woods",
          "Random entry body",
          DateTime(2021, 1, 21),
          LocationEntity("Quito", "Ecuador", -1, -1)),
      EntryEntity(
          "90c77747-1e2f-416d-b045-f84abca08235",
          "Rise and Shine",
          "Random entry body",
          DateTime(2019, 7, 10),
          LocationEntity("Paris", "France", -1, -1)),
      EntryEntity(
          "fbc1c0f8-15a8-4b1a-828b-f18b792cbeb9",
          "Two's a Crowd",
          "Random entry body",
          DateTime(2018, 3, 14),
          LocationEntity("Melbourne", "Australia", -1, -1)),
      EntryEntity(
          "44e1f4da-150e-4907-aa71-06ea39272771",
          "Swift is Not Reactive",
          "Random entry body",
          DateTime(2018, 1, 1),
          LocationEntity("Boston", "Massachusetts", -1, -1)),
      EntryEntity(
          "24835fde-6537-4c43-90e4-05ab29c8f231",
          "The Answer to Life, the Universe, and Everything is 42",
          "Random entry body",
          DateTime(2015, 6, 22),
          LocationEntity("Hilo", "Hawaii", -1, -1))
    ]);
  }

  @override
  Future saveEntries(List<EntryEntity> entries) {
    return Future.sync(() => null);
  }
}
