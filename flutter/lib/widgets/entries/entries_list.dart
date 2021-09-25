import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/blocs/entries/entries.dart';
import 'package:journey/models/entry.dart';

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
      } else {
        return this._buildZeroState();
      }
    });
  }

  Widget _buildLoading() {
    return ListView(
      children: [EntryItemLoading(), EntryItemLoading(), EntryItemLoading()],
    );
  }

  Widget _buildLoaded(List<Entry> entries) {
    return ListView.builder(
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

  Widget _buildZeroState() {
    return Container();
  }
}
