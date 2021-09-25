import 'package:journey/models/entry.dart';
import 'package:journey/persistence/database_provider.dart';
import 'package:journey/repositories/entry_repository.dart';

import 'entry_dao.dart';

class EntryDatabaseRepository implements EntryRepository {
  final _dao = EntryDao();
  final DatabaseProvider _databaseProvider;

  EntryDatabaseRepository(this._databaseProvider);

  @override
  Future<List<Entry>> getEntries() async {
    final db = await _databaseProvider.db();
    List<Map<String, dynamic>> maps = await db.query(_dao.tableName);
    return _dao.fromList(maps);
  }

  @override
  Future<Entry> insert(Entry entry) async {
    final db = await _databaseProvider.db();
    await db.insert(_dao.tableName, _dao.toMap(entry));
    return entry;
  }

  @override
  Future<Entry> update(Entry entry) async {
    final db = await _databaseProvider.db();
    await db.update(_dao.tableName, _dao.toMap(entry),
        where: _dao.columnId + " = ?", whereArgs: [entry.id]);
    return entry;
  }

  @override
  Future<Entry> delete(Entry entry) async {
    final db = await _databaseProvider.db();
    await db.delete(_dao.tableName,
        where: _dao.columnId + " = ?", whereArgs: [entry.id]);
    return entry;
  }
}
