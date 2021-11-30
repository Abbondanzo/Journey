import 'package:flutter/material.dart';

class DashboardTab extends StatelessWidget {
  final String name;
  final Icon icon;

  DashboardTab({required this.name, required this.icon});

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

class DashboardTabBar extends Container implements PreferredSizeWidget {
  final TabController controller;
  final List<DashboardTab> dashboardTabs;

  DashboardTabBar({required this.controller, required this.dashboardTabs});

  TabBar _getTabBar({Color? primaryColor = Colors.black}) {
    return TabBar(
        controller: controller,
        indicatorColor: primaryColor,
        labelColor: primaryColor,
        labelPadding: EdgeInsets.zero,
        unselectedLabelColor: Color(0xFF8E8E8E),
        tabs: dashboardTabs);
  }

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = Theme.of(context).primaryColor;
    final Color dividerColor = Theme.of(context).dividerColor;
    final TabBar tabBar = _getTabBar(primaryColor: primaryColor);
    return PreferredSize(
      preferredSize: tabBar.preferredSize,
      child: Container(
        decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: dividerColor))),
        child: tabBar,
      ),
    );
  }

  @override
  Size get preferredSize => _getTabBar().preferredSize;
}
