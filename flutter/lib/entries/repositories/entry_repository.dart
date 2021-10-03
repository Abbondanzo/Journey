import 'package:journey/entries/models/entry.dart';

abstract class EntryRepository {
  Future<Entry> insert(Entry entry);

  Future<Entry> update(Entry entry);

  Future<Entry> delete(Entry entry);

  Future<List<Entry>> getEntries();
}
