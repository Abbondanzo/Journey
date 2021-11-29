import 'dart:math';

import 'package:flutter/material.dart';

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

// 1
class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final double minHeight;
  final double maxHeight;
  final Widget child;

  _SliverAppBarDelegate({
    required this.minHeight,
    required this.maxHeight,
    required this.child,
  });

  @override
  double get minExtent => minHeight;

  @override
  double get maxExtent => max(maxHeight, minHeight);

  // 2
  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return SizedBox.expand(child: child);
  }

  // 3
  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return maxHeight != oldDelegate.maxHeight ||
        minHeight != oldDelegate.minHeight ||
        child != oldDelegate.child;
  }
}

class DashboardTabBar extends StatelessWidget {
  final TabController controller;

  DashboardTabBar({required this.controller});

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = Theme.of(context).primaryColor;
    final Color dividerColor = Theme.of(context).dividerColor;
    return SliverPersistentHeader(
        pinned: true,
        delegate: _SliverAppBarDelegate(
            minHeight: 44.0,
            maxHeight: 44.0,
            child: Container(
              decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(bottom: BorderSide(color: dividerColor))),
              child: TabBar(
                  controller: controller,
                  indicatorColor: primaryColor,
                  labelColor: primaryColor,
                  labelPadding: EdgeInsets.zero,
                  unselectedLabelColor: Color(0xFF8E8E8E),
                  tabs: [
                    _DashboardTab(icon: Icon(Icons.map_outlined)),
                    _DashboardTab(icon: Icon(Icons.local_activity_outlined)),
                    _DashboardTab(icon: Icon(Icons.book_outlined))
                  ]),
            )));
  }
}
