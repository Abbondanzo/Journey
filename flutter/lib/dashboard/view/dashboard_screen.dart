import 'dart:math';

import 'package:flutter/material.dart';
import 'package:journey/entries/entries.dart';

import './dashboard_name.dart';
import './dashboard_profile_image.dart';
import './dashboard_tab_bar.dart';

class DashboardScreen extends StatefulWidget {
  @override
  State<StatefulWidget> createState() {
    return DashboardScreenState();
  }
}

class _DashboardTabView extends StatelessWidget {
  final String tabName;
  final Widget child;

  _DashboardTabView({required this.tabName, required this.child});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      bottom: false,
      child: Builder(
        builder: (BuildContext context) {
          return CustomScrollView(
            key: PageStorageKey<String>(tabName),
            slivers: <Widget>[
              SliverOverlapInjector(
                handle:
                    NestedScrollView.sliverOverlapAbsorberHandleFor(context),
              ),
              SliverToBoxAdapter(child: child)
            ],
          );
        },
      ),
    );
  }
}

class DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  final _appBarHeight = 300.0;
  final _dashboardTabs = [
    DashboardTab(name: 'Map', icon: Icon(Icons.map_outlined)),
    DashboardTab(name: 'Stats', icon: Icon(Icons.local_activity_outlined)),
    DashboardTab(name: 'Entries', icon: Icon(Icons.book_outlined))
  ];

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
    final Color primaryColor = Theme.of(context).primaryColor;
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return <Widget>[
            SliverOverlapAbsorber(
              handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
              sliver: SliverAppBar(
                  title: const Text('Dashboard'),
                  centerTitle: true,
                  pinned: true,
                  expandedHeight: _appBarHeight,
                  forceElevated: innerBoxIsScrolled,
                  flexibleSpace: FlexibleSpaceBar(
                      titlePadding: const EdgeInsets.only(bottom: 8.0),
                      centerTitle: true,
                      collapseMode: CollapseMode.parallax,
                      background: Container(
                          decoration: new BoxDecoration(
                            gradient: new LinearGradient(
                                begin: Alignment(-1.0, -1),
                                end: Alignment(1.0, 1),
                                colors: [Color(0xFF5B70D9), primaryColor]),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(height: kToolbarHeight),
                              DashboardProfileImage(),
                              const SizedBox(height: 12),
                              DashboardName(),
                              const SizedBox(height: 24),
                            ],
                          ))),
                  bottom: DashboardTabBar(
                      controller: _tabController,
                      dashboardTabs: _dashboardTabs)),
            ),
          ];
        },
        body: TabBarView(controller: _tabController, children: [
          _DashboardTabView(
              tabName: _dashboardTabs[0].name,
              child: Center(child: Text('Map'))),
          _DashboardTabView(
              tabName: _dashboardTabs[1].name,
              child: Center(child: Text('Stats'))),
          _DashboardTabView(
              tabName: _dashboardTabs[2].name, child: EntriesList())
        ]),
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
