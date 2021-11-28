import 'package:flutter/material.dart';
import 'package:journey/entries/entries.dart';

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

class DashboardContent extends StatefulWidget {
  @override
  State<StatefulWidget> createState() {
    return DashboardContentState();
  }
}

class DashboardContentState extends State<DashboardContent>
    with SingleTickerProviderStateMixin {
  late TabController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TabController(vsync: this, length: 3, initialIndex: 2);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = Theme.of(context).primaryColor;
    final Color dividerColor = Theme.of(context).dividerColor;

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: dividerColor))),
          child: TabBar(
              controller: _controller,
              indicatorColor: primaryColor,
              labelColor: primaryColor,
              labelPadding: EdgeInsets.zero,
              unselectedLabelColor: Color(0xFF8E8E8E),
              tabs: [
                _DashboardTab(icon: Icon(Icons.map_outlined)),
                _DashboardTab(icon: Icon(Icons.local_activity_outlined)),
                _DashboardTab(icon: Icon(Icons.book_outlined))
              ]),
        ),
        Expanded(
            child: TabBarView(
          controller: _controller,
          children: [
            Center(child: Text("Map")),
            Center(child: Text("Stats")),
            EntriesList()
          ],
        ))
      ],
    );
  }
}
