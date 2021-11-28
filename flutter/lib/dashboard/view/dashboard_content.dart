import 'package:flutter/material.dart';
import 'package:journey/entries/entries.dart';

class DashboardContent extends StatefulWidget {
  @override
  State<StatefulWidget> createState() {
    return DashboardContentState();
  }
}

class DashboardContentState extends State<DashboardContent>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  var currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(vsync: this, length: 3);
    _tabController.addListener(_handleTabSelection);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _handleTabSelection() {
    setState(() {
      currentIndex = _tabController.index;
    });
  }

  Color _getIconColor(BuildContext context, int tabIndex) {
    if (currentIndex == tabIndex) {
      return Theme.of(context).primaryColor;
    } else {
      return Color(0xFF8E8E8E);
    }
  }

  @override
  Widget build(BuildContext context) {
    print(currentIndex);
    return Column(mainAxisSize: MainAxisSize.min, children: [
      TabBar(
        controller: _tabController,
        tabs: [
          Tab(
            icon: Icon(Icons.directions_car, color: _getIconColor(context, 0)),
          ),
          Tab(
              icon: Icon(Icons.directions_transit,
                  color: _getIconColor(context, 1))),
          Tab(
              icon: Icon(Icons.directions_bike,
                  color: _getIconColor(context, 2))),
        ],
      ),
      Expanded(child: EntriesList()),
    ]);
  }
}
