import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../models/entry.dart';
import '../repositories/entry_repository.dart';

part 'entries_event.dart';
part 'entries_state.dart';

class EntriesBloc extends Bloc<EntriesEvent, EntriesState> {
  final EntryRepository entryRepository;

  EntriesBloc({required this.entryRepository}) : super(EntriesLoading()) {
    on<LoadEntries>(_onLoadEntries);
    on<AddEntry>(_onAddEntry);
    on<UpdateEntry>(_onUpdateEntry);
    on<DeleteEntry>(_onDeleteEntry);
  }

  void _onLoadEntries(LoadEntries event, Emitter<EntriesState> emit) async {
    try {
      final entries = await entryRepository.getEntries();
      emit(EntriesLoaded(entries));
    } catch (e) {
      if (e is Exception) {
        emit(EntriesNotLoaded(e));
      } else if (e is TypeError) {
        emit(EntriesNotLoaded(Exception(e.toString())));
      } else {
        emit(EntriesNotLoaded(
            Exception('Something went wrong while loading entries')));
      }
    }
  }

  void _onAddEntry(AddEntry event, Emitter<EntriesState> emit) async {
    if (state is EntriesLoaded) {
      final updatedEntries = List<Entry>.from((state as EntriesLoaded).entries)
        ..add(event.entry);
      emit(EntriesLoaded(updatedEntries));
      await entryRepository.insert(event.entry);
    }
  }

  void _onUpdateEntry(UpdateEntry event, Emitter<EntriesState> emit) async {
    if (state is EntriesLoaded) {
      final updatedEntries = (state as EntriesLoaded).entries.map((entry) {
        return entry.id == event.updatedEntry.id ? event.updatedEntry : entry;
      }).toList();
      emit(EntriesLoaded(updatedEntries));
      await entryRepository.update(event.updatedEntry);
    }
  }

  void _onDeleteEntry(DeleteEntry event, Emitter<EntriesState> emit) async {
    if (state is EntriesLoaded) {
      final updatedEntries = (state as EntriesLoaded)
          .entries
          .where((entry) => entry.id != event.entry.id)
          .toList();
      emit(EntriesLoaded(updatedEntries));
      await entryRepository.delete(event.entry.id);
    }
  }
}
