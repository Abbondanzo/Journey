import 'package:equatable/equatable.dart';
import 'package:journey/models/models.dart';

abstract class EntriesState extends Equatable {
  const EntriesState();

  @override
  List<Object> get props => [];
}

class EntriesLoading extends EntriesState {}

class EntriesLoaded extends EntriesState {
  final List<Entry> entries;

  const EntriesLoaded([this.entries = const []]);

  @override
  List<Object> get props => [entries];

  @override
  String toString() => 'EntriesLoaded { entries: $entries }';
}

class EntriesNotLoaded extends EntriesState {}
