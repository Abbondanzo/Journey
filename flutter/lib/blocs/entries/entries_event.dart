import 'package:equatable/equatable.dart';
import 'package:journey/models/models.dart';

abstract class EntriesEvent extends Equatable {
  const EntriesEvent();

  @override
  List<Object> get props => [];
}

class LoadEntries extends EntriesEvent {}

class AddEntry extends EntriesEvent {
  final Entry entry;

  const AddEntry(this.entry);

  @override
  List<Object> get props => [entry];

  @override
  String toString() => 'AddEntry { entry: $entry }';
}

class UpdateEntry extends EntriesEvent {
  final Entry updatedEntry;

  const UpdateEntry(this.updatedEntry);

  @override
  List<Object> get props => [updatedEntry];

  @override
  String toString() => 'UpdateEntry { updatedEntry: $updatedEntry }';
}

class DeleteEntry extends EntriesEvent {
  final Entry entry;

  const DeleteEntry(this.entry);

  @override
  List<Object> get props => [entry];

  @override
  String toString() => 'DeleteEntry { entry: $entry }';
}
