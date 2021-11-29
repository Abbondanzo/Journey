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
        return this._buildZeroState();
      } else if (state is EntriesNotLoaded) {
        return this._buildErrorState(context, state.exception);
      } else {
        throw ArgumentError.value(state, 'Illegal entry state');
      }
    });
  }

  RenderObjectWidget _buildLoading() {
    return SliverList(
      delegate: SliverChildBuilderDelegate((BuildContext context, int index) {
        return EntryItemLoading();
      }, childCount: 3),
    );
  }

  RenderObjectWidget _buildLoaded(List<Entry> entries) {
    if (entries.isEmpty) {
      return _buildZeroState();
    }
    return SliverList(
      delegate: SliverChildBuilderDelegate((BuildContext context, int index) {
        return EntryItem(
            entry: entries[index],
            onTap: () {
              print("Item $index");
            });
      }, childCount: entries.length),
    );
    // return SliverList.separated(
    //   shrinkWrap: true,
    //   itemCount: entries.length,
    //   itemBuilder: (BuildContext context, int index) {
    //     final entry = entries[index];
    //     return EntryItem(
    //         entry: entry,
    //         onTap: () {
    //           print("Item $index");
    //         });
    //   },
    //   separatorBuilder: (context, index) => Divider(height: 1),
    // );
  }

  RenderObjectWidget _buildErrorState(BuildContext context, Exception e) {
    return SliverToBoxAdapter(
        child: Container(
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
            ])));
  }

  RenderObjectWidget _buildZeroState() {
    return SliverToBoxAdapter(
        child: Container(
            alignment: Alignment.center,
            child: const Text(
              'No entries exist!',
            )));
  }
}
