import 'package:equatable/equatable.dart';
import 'package:journey/models/user.dart';

abstract class UserState extends Equatable {
  const UserState();

  @override
  List<Object> get props => [];
}

class EntriesLoading extends UserState {}

class UserLoaded extends UserState {
  final User? user;

  const UserLoaded([this.user = null]);

  @override
  List<Object> get props => [user ?? true];

  @override
  String toString() => 'UserLoaded { user: $user }';
}

class UserNotLoaded extends UserState {
  final Exception exception;

  const UserNotLoaded(this.exception);
}
