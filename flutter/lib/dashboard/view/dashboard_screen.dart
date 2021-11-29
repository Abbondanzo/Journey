import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:journey/authentication/authentication.dart';
import 'package:journey/dashboard/view/dashboard_tab_bar.dart';
import 'package:journey/entries/entries.dart';

import './dashboard_content.dart';

class _DashboardTab extends StatelessWidget {
  final Icon icon;

  _DashboardTab({required this.icon});

  @override
  Widget build(BuildContext context) {
    final Color dividerColor = Theme.of(context).dividerColor;
    return Tab(
      child: Container(
        child: icon,
        alignment: Alignment.center,
        height: double.infinity,
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(color: dividerColor),
          ),
        ),
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  @override
  State<StatefulWidget> createState() {
    return DashboardScreenState();
  }
}

class DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  final _appBarHeight = 200.0;

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
    final Color dividerColor = Theme.of(context).dividerColor;

    return Scaffold(
      body: CustomScrollView(
        controller: _scrollController,
        slivers: <Widget>[
          SliverAppBar(
              pinned: true,
              expandedHeight: _appBarHeight,
              floating: false,
              flexibleSpace: LayoutBuilder(
                  builder: (BuildContext context, BoxConstraints constraints) {
                final percent = ((constraints.maxHeight - kToolbarHeight) *
                    100 /
                    (_appBarHeight - kToolbarHeight));
                print(percent);
                return Align(
                    alignment: FractionalOffset.bottomCenter,
                    child: DashboardTabBar(controller: _tabController));
              })),
          SliverFillRemaining(
              child: TabBarView(
            controller: _tabController,
            children: [
              Center(child: Text("Map")),
              Center(child: Text("Stats")),
              Center(child: EntriesList())
            ],
          ))

          // SliverFillRemaining(
          //     fillOverscroll: true,
          //     child: TabBarView(
          //       controller: _tabController,
          //       children: [
          //         Center(child: Text("Map")),
          //         Center(child: Text("Stats")),
          //         EntriesList()
          //       ],
          //     ))
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
        tooltip: "Add Entry",
      ),
    );

    //   return Column(
    //     children: [
    //       Container(
    //         decoration: BoxDecoration(
    //             border: Border(bottom: BorderSide(color: dividerColor))),
    //         child: TabBar(
    //             controller: _tabController,
    //             indicatorColor: primaryColor,
    //             labelColor: primaryColor,
    //             labelPadding: EdgeInsets.zero,
    //             unselectedLabelColor: Color(0xFF8E8E8E),
    //             tabs: [
    //               _DashboardTab(icon: Icon(Icons.map_outlined)),
    //               _DashboardTab(icon: Icon(Icons.local_activity_outlined)),
    //               _DashboardTab(icon: Icon(Icons.book_outlined))
    //             ]),
    //       ),
    //       Expanded(
    //           child: TabBarView(
    //         controller: _tabController,
    //         children: [
    //           Center(child: Text("Map")),
    //           Center(child: Text("Stats")),
    //           EntriesList()
    //         ],
    //       ))
    //     ],
    //   );
  }
}

// class DashboardScreen extends StatelessWidget {
//   final _scrollController = ScrollController();
//   final _appBarHeight = 200.0;

//   @override
//   Widget build(BuildContext context) {
//     final Color primaryColor = Theme.of(context).primaryColor;
//     final Color dividerColor = Theme.of(context).dividerColor;

    // return Scaffold(
    //   body: CustomScrollView(
    //     controller: _scrollController,
    //     slivers: <Widget>[
    //       SliverAppBar(
    //           pinned: true,
    //           expandedHeight: _appBarHeight,
    //           floating: false,
    //           flexibleSpace: LayoutBuilder(
    //               builder: (BuildContext context, BoxConstraints constraints) {
    //             final percent = ((constraints.maxHeight - kToolbarHeight) *
    //                 100 /
    //                 (_appBarHeight - kToolbarHeight));
    //             print(percent);
    //             return Stack(
    //               children: <Widget>[
    //                 //image background
    //                 // Text(
    //                 //   "FlutteRotate",
    //                 //   style: TextStyle(color: Colors.white, fontSize: 18.0),
    //                 // ),
    //                 Align(
    //                     alignment: Alignment.bottomRight,
    //                     child: FloatingActionButton(
    //                       child: Icon(
    //                         Icons.add,
    //                         color: Colors.red,
    //                       ),
    //                       onPressed: () {},
    //                     )),
    //               ],
    //             );
    //           })),
    //       // Expanded(child: DashboardScreen())
    //       SliverFillRemaining(child: DashboardScreen())
    //     ],
    //   ),
    //   floatingActionButton: FloatingActionButton(
    //     onPressed: () {
    //       Navigator.push(
    //         context,
    //         MaterialPageRoute(builder: (context) {
    //           return AddEntryScreen();
    //         }),
    //       );
    //     },
    //     child: Icon(Icons.add),
    //     tooltip: "Add Entry",
    //   ),
    // );

//     // return Scaffold(
//     //   appBar: AppBar(title: const Text('Dashboard')),
//     //   body: Center(
//     //     child: Column(
//     //       mainAxisSize: MainAxisSize.min,
//     //       children: <Widget>[
//     //         Builder(
//     //           builder: (context) {
//     //             final userId = context.select(
//     //               (UserBloc bloc) {
//     //                 if (bloc.state is UserLoaded) {
//     //                   return (bloc.state as UserLoaded).user?.id;
//     //                 }
//     //               },
//     //             );
//     //             return Text('UserID: $userId');
//     //           },
//     //         ),
//     //         ElevatedButton(
//     //           child: const Text('Logout'),
//     //           onPressed: () {
//     //             context.read<UserBloc>().add(RemoveUser());
//     //           },
//     //         ),
//     //         Expanded(child: DashboardScreen())
//     //       ],
//     //     ),
//     //   ),
//     //   floatingActionButton: FloatingActionButton(
//     //     onPressed: () {
//     //       Navigator.push(
//     //         context,
//     //         MaterialPageRoute(builder: (context) {
//     //           return AddEntryScreen();
//     //         }),
//     //       );
//     //     },
//     //     child: Icon(Icons.add),
//     //     tooltip: "Add Entry",
//     //   ),
//     // );
//   }
// }
