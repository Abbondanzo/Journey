import 'package:journey/entries/models/entry.dart';

abstract class EntryRepository {
  Future<Entry> insert(Entry entry);

  Future<Entry> update(Entry entry);

  Future<void> delete(String entryId);

  Future<List<Entry>> getEntries();
}
