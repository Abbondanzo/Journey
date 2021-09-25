import 'package:equatable/equatable.dart';
import 'package:journey/models/uuid.dart';
import 'package:meta/meta.dart';

@immutable
class User extends Equatable {
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
  List<Object?> get props => [id, firstName, lastName, profilePicture];
}
