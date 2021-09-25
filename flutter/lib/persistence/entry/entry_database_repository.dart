import 'package:journey/models/entry.dart';
import 'package:journey/persistence/database_provider.dart';
import 'package:journey/repositories/entry_repository.dart';

import 'entry_dao.dart';

class EntryDatabaseRepository implements EntryRepository {
  final dao = EntryDao();
  final DatabaseProvider databaseProvider;

  EntryDatabaseRepository(this.databaseProvider);

  @override
  Future<List<Entry>> getEntries() async {
    final db = await databaseProvider.db();
    List<Map<String, dynamic>> maps = await db.query(dao.tableName);
    return dao.fromList(maps);
  }

  @override
  Future<Entry> insert(Entry entry) async {
    final db = await databaseProvider.db();
    await db.insert(dao.tableName, dao.toMap(entry));
    return entry;
  }

  @override
  Future<Entry> update(Entry entry) async {
    final db = await databaseProvider.db();
    await db.update(dao.tableName, dao.toMap(entry),
        where: dao.columnId + " = ?", whereArgs: [entry.id]);
    return entry;
  }

  @override
  Future<Entry> delete(Entry entry) async {
    final db = await databaseProvider.db();
    await db.delete(dao.tableName,
        where: dao.columnId + " = ?", whereArgs: [entry.id]);
    return entry;
  }
}
