import 'package:journey/models/user.dart';
import 'package:journey/persistence/user/user_dao.dart';
import 'package:journey/repositories/user_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserPreferencesRepository implements UserRepository {
  final preferenceKey = 'user';

  final _dao = UserDao();
  final _prefs = SharedPreferences.getInstance();

  @override
  Future<User?> getUser() async {
    final instance = await _prefs;
    final jsonSource = instance.getString(preferenceKey);
    if (jsonSource == null) {
      return null;
    }
    return _dao.fromJSONString(jsonSource);
  }

  @override
  Future<void> removeUser() async {
    final instance = await _prefs;
    await instance.remove(preferenceKey);
  }

  @override
  Future<void> setUser(User user) async {
    final instance = await _prefs;
    final jsonSource = _dao.toJSONString(user);
    await instance.setString(preferenceKey, jsonSource);
  }
}
