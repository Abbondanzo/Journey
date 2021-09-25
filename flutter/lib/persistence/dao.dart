abstract class Dao<T> {
  /// Called during onCreate
  String get createTableQuery;

  /// Mapping from the database entity to the generic object class
  T fromMap(Map<String, dynamic> query);

  /// Mapping from the generic object class to the database entity
  Map<String, dynamic> toMap(T object);

  /// Helper method for converting a list of database entities
  List<T> fromList(List<Map<String, dynamic>> query) {
    List<T> items = [];
    for (Map map in query) {
      items.add(fromMap(map));
    }
    return items;
  }
}
