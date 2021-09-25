import 'dart:async';

import 'package:bloc/bloc.dart';
import 'package:journey/models/entry.dart';
import 'package:journey/repositories/entry_repository.dart';

import 'entries_event.dart';
import 'entries_state.dart';

class EntriesBloc extends Bloc<EntriesEvent, EntriesState> {
  final EntryRepository entryRepository;

  EntriesBloc({required this.entryRepository}) : super(EntriesLoading());

  @override
  Stream<EntriesState> mapEventToState(EntriesEvent event) async* {
    if (event is LoadEntries) {
      yield* _mapLoadEntriesToState();
    } else if (event is AddEntry) {
      yield* _mapAddEntryToState(event);
    } else if (event is UpdateEntry) {
      yield* _mapUpdateEntryToState(event);
    } else if (event is DeleteEntry) {
      yield* _mapDeleteEntryToState(event);
    }
  }

  Stream<EntriesState> _mapLoadEntriesToState() async* {
    try {
      final entries = await entryRepository.getEntries();
      yield EntriesLoaded(entries);
    } catch (e) {
      yield EntriesNotLoaded(e as Exception);
    }
  }

  Stream<EntriesState> _mapAddEntryToState(AddEntry event) async* {
    if (state is EntriesLoaded) {
      final updatedEntries = List<Entry>.from((state as EntriesLoaded).entries)
        ..add(event.entry);
      yield EntriesLoaded(updatedEntries);
      await entryRepository.insert(event.entry);
    }
  }

  Stream<EntriesState> _mapUpdateEntryToState(UpdateEntry event) async* {
    if (state is EntriesLoaded) {
      final updatedEntries = (state as EntriesLoaded).entries.map((entry) {
        return entry.id == event.updatedEntry.id ? event.updatedEntry : entry;
      }).toList();
      yield EntriesLoaded(updatedEntries);
      await entryRepository.update(event.updatedEntry);
    }
  }

  Stream<EntriesState> _mapDeleteEntryToState(DeleteEntry event) async* {
    if (state is EntriesLoaded) {
      final updatedEntries = (state as EntriesLoaded)
          .entries
          .where((entry) => entry.id != event.entry.id)
          .toList();
      yield EntriesLoaded(updatedEntries);
      await entryRepository.delete(event.entry);
    }
  }
}
