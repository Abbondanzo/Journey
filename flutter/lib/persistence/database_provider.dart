import 'package:journey/entries/persistence/entry_database_repository.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class DatabaseProvider {
  static final _instance = DatabaseProvider._internal();
  static final DatabaseProvider get = _instance;
  DatabaseProvider._internal();

  Future<Database>? _db;

  Future<Database> db() {
    return _db ??= _initDb();
  }

  // Guaranteed to be called only once.
  Future<Database> _initDb() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, 'journey.db');
    return openDatabase(path, version: 1, onCreate: _onCreate);
  }

  Future _onCreate(Database db, int version) async {
    await db.execute(EntryDao().createTableQuery);
  }
}
