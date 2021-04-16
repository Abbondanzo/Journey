package com.abbondanzo.journey.ui.dashboard

import androidx.annotation.StringRes
import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.abbondanzo.journey.R
import com.abbondanzo.journey.ui.dashboard.entries.EntriesFragment
import com.abbondanzo.journey.ui.home.HomeFragment

internal class DashboardViewPager(private val fragment: Fragment) : FragmentStateAdapter(fragment) {

    companion object {
        private data class PagerItem(
            @StringRes val title: Int,
            val fragmentConstructor: () -> Fragment
        )

        private fun getPagerItems(): List<PagerItem> {
            return listOf(
                PagerItem(R.string.menu_home, ::HomeFragment),
                PagerItem(R.string.menu_log_entries, ::EntriesFragment),
            )
        }
    }

    private val pagerItems by lazy { getPagerItems() }

    override fun getItemCount(): Int {
        return pagerItems.size
    }

    override fun createFragment(position: Int): Fragment {
        return pagerItems[position].fragmentConstructor()
    }

    fun getTitle(position: Int): String {
        return fragment.getString(pagerItems[position].title)
    }
}
