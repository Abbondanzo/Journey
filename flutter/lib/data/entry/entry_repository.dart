import 'entry_entity.dart';

abstract class EntryRepository {
  Future<List<EntryEntity>> loadEntries();

  Future saveEntries(List<EntryEntity> entries);
}
