import 'package:meta/meta.dart';

@immutable
class User {
  final String firstName;
  final String lastName;
  final String? profilePicture;

  User(this.firstName, this.lastName, this.profilePicture);

  @override
  int get hashCode =>
      firstName.hashCode ^ lastName.hashCode ^ profilePicture.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          firstName == other.firstName &&
          lastName == other.lastName &&
          profilePicture == other.profilePicture;

  @override
  String toString() {
    return 'User{firstName: $firstName, lastName: $lastName, profilePicture: $profilePicture}';
  }
}
