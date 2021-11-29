import 'dart:math';

import 'package:flutter/material.dart';
import 'package:journey/entries/entries.dart';

import './dashboard_profile_image.dart';
import './dashboard_tab_bar.dart';

class DashboardScreen extends StatefulWidget {
  @override
  State<StatefulWidget> createState() {
    return DashboardScreenState();
  }
}

class DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  final _appBarHeight = 200.0;
  final _fadeOutThreshold = 40.0;

  late TabController _tabController;
  late ScrollController _scrollController;
  @override
  void initState() {
    super.initState();
    _tabController = TabController(vsync: this, length: 3, initialIndex: 2);
    _scrollController = ScrollController();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        controller: _scrollController,
        slivers: <Widget>[
          SliverAppBar(
              pinned: true,
              expandedHeight: _appBarHeight,
              floating: false,
              title: Text('Dashboard'),
              centerTitle: true,
              flexibleSpace: LayoutBuilder(
                  builder: (BuildContext context, BoxConstraints constraints) {
                final rawPercentAboveThreshold = (constraints.maxHeight -
                        kToolbarHeight -
                        _fadeOutThreshold) /
                    (_appBarHeight - kToolbarHeight - _fadeOutThreshold);
                // Bounds percentange to [0, 1]
                final double opacity = max(min(rawPercentAboveThreshold, 1), 0);
                return SafeArea(
                    child: Container(
                        alignment: Alignment.center,
                        child: Opacity(
                          opacity: opacity,
                          child: Stack(
                            children: [DashboardProfileImage()],
                          ),
                        )));
              })),
          DashboardTabBar(controller: _tabController),
          SliverFillRemaining(
              child: TabBarView(
            controller: _tabController,
            children: [
              Center(child: Text('Map')),
              Center(child: Text('Stats')),
              Center(child: EntriesList())
            ],
          ))
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) {
              return AddEntryScreen();
            }),
          );
        },
        child: Icon(Icons.add),
        tooltip: 'Add Entry',
      ),
    );
  }
}
