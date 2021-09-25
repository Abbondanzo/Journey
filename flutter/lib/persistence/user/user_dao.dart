import 'dart:convert';

import 'package:journey/models/user.dart';

class UserDao {
  final _keyId = 'id';
  final _keyFirstName = 'firstName';
  final _keyLastName = 'lastName';
  final _keyProfilePicture = 'profilePicture';

  User fromJSONString(String source) {
    return _fromMap(jsonDecode(source));
  }

  User _fromMap(Map<String, dynamic> json) {
    return User(
        id: json[_keyId],
        firstName: json[_keyFirstName],
        lastName: json[_keyLastName],
        profilePicture: json[_keyProfilePicture]);
  }

  String toJSONString(User source) {
    return jsonEncode(_toMap(source));
  }

  Map<String, dynamic> _toMap(User object) {
    return {
      _keyId: object.id,
      _keyFirstName: object.firstName,
      _keyLastName: object.lastName,
      _keyProfilePicture: object.profilePicture
    };
  }
}
