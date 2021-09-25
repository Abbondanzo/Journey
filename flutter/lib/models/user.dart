import 'package:journey/models/uuid.dart';
import 'package:meta/meta.dart';

@immutable
class User {
  final String id;
  final String firstName;
  final String lastName;
  final String? profilePicture;

  User(
      {String? id,
      required String firstName,
      required String lastName,
      String? profilePicture})
      : id = id ?? Uuid().generateV4(),
        firstName = firstName,
        lastName = lastName,
        profilePicture = profilePicture;

  @override
  int get hashCode =>
      id.hashCode ^
      firstName.hashCode ^
      lastName.hashCode ^
      profilePicture.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          firstName == other.firstName &&
          lastName == other.lastName &&
          profilePicture == other.profilePicture;

  @override
  String toString() {
    return 'User{id: $id, firstName: $firstName, lastName: $lastName, profilePicture: $profilePicture}';
  }
}
