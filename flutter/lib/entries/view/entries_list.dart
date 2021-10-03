import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/entries/entries.dart';

import 'entry_item.dart';
import 'entry_item_loading.dart';

class EntriesList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EntriesBloc, EntriesState>(builder: (_, state) {
      print(state);
      if (state is EntriesLoading) {
        return this._buildLoading();
      } else if (state is EntriesLoaded) {
        return this._buildLoaded(state.entries);
      } else if (state is EntriesNotLoaded) {
        return this._buildErrorState(context, state.exception);
      } else {
        throw ArgumentError.value(state, 'Illegal entry state');
      }
    });
  }

  Widget _buildLoading() {
    return ListView(
      children: [EntryItemLoading(), EntryItemLoading(), EntryItemLoading()],
    );
  }

  Widget _buildLoaded(List<Entry> entries) {
    if (entries.isEmpty) {
      return _buildZeroState();
    }
    print(entries);
    return ListView.builder(
      shrinkWrap: true,
      itemCount: entries.length,
      itemBuilder: (BuildContext context, int index) {
        final entry = entries[index];
        return EntryItem(
            entry: entry,
            onTap: () {
              print("Item $index");
            });
      },
    );
  }

  Widget _buildErrorState(BuildContext context, Exception e) {
    print(e);
    return Container(
        alignment: Alignment.center,
        child: Column(children: [
          const Text(
            'Entries failed to load. Tap to retry',
          ),
          ElevatedButton(
              onPressed: () {
                context.read<EntriesBloc>().add(LoadEntries());
              },
              child: const Text('Retry'))
        ]));
  }

  Widget _buildZeroState() {
    return Container(
        alignment: Alignment.center,
        child: const Text(
          'No entries exist!',
        ));
  }
}
