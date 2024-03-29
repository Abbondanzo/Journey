import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/entries/entries.dart';

import 'entry_item.dart';
import 'entry_item_loading.dart';

class EntriesList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EntriesBloc, EntriesState>(builder: (_, state) {
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
    return Column(
      children: [EntryItemLoading(), EntryItemLoading(), EntryItemLoading()],
    );
  }

  Widget _buildLoaded(List<Entry> entries) {
    if (entries.isEmpty) {
      return _buildZeroState();
    }

    return Column(
        children: entries.map<Widget>((entry) {
      return EntryItem(
          entry: entry,
          onTap: () {
            print("Item $entry");
          });
    }).toList());
  }

  Widget _buildErrorState(BuildContext context, Exception e) {
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
