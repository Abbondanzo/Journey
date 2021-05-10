import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/blocs/entries/entries.dart';
import 'package:journey/widgets/entries/entry_item.dart';

class EntriesList extends StatelessWidget {
  EntriesList({
    Key key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<EntriesBloc, EntriesState>(
        builder: (BuildContext context, EntriesState state) {
      if (state is EntriesLoading) {
        return this._buildLoading();
      } else if (state is EntriesLoaded) {
        final entries = state.entries;
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
      } else {
        return Container();
      }
    });
  }

  // TODO
  Widget _buildLoading() {}
}
