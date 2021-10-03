import 'package:journey/authentication/authentication.dart';

abstract class UserRepository {
  Future<User?> getUser();

  Future<void> removeUser();

  Future<void> setUser(User entry);
}
