import 'package:journey/models/user.dart';

abstract class UserRepository {
  Future<User?> getUser();

  Future<void> removeUser();

  Future<void> setUser(User entry);
}
