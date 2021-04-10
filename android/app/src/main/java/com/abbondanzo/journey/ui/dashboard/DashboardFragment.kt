package com.abbondanzo.journey.ui.dashboard

import androidx.fragment.app.Fragment
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentEntriesBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
internal class DashboardFragment : Fragment(R.layout.fragment_dashboard) {
    private val binding by lazy { FragmentEntriesBinding.bind(requireView()) }
}
