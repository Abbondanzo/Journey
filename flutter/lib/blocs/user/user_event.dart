import 'package:equatable/equatable.dart';
import 'package:journey/models/user.dart';

abstract class UserEvent extends Equatable {
  const UserEvent();

  @override
  List<Object> get props => [];
}

class LoadUser extends UserEvent {}

class RemoveUser extends UserEvent {}

class SetUser extends UserEvent {
  final User user;

  const SetUser(this.user);

  @override
  List<Object> get props => [user];

  @override
  String toString() => 'SetUser { user: $user }';
}
