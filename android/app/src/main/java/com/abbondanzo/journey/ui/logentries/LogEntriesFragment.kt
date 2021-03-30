package com.abbondanzo.journey.ui.logentries

import android.os.Bundle
import android.view.View
import androidx.lifecycle.observe
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentLogEntriesBinding
import com.abbondanzo.journey.ui.base.BaseFragment
import com.abbondanzo.journey.ui.logentries.adapter.LogEntriesAdapter
import com.abbondanzo.journey.ui.logentries.adapter.LogEntryListItem

internal class LogEntriesFragment : BaseFragment<LogEntriesViewModel>(R.layout.fragment_log_entries) {

    private val binding by lazy { FragmentLogEntriesBinding.bind(requireView()) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = getFragmentViewModel()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        viewModel.logEntries.observe(viewLifecycleOwner, this::handleLogEntries)
    }

    private fun setupRecyclerView() {
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = LogEntriesAdapter()
            addItemDecoration(DividerItemDecoration(context, DividerItemDecoration.VERTICAL))
        }
    }

    private fun handleLogEntries(list: List<LogEntryListItem>) {
        (binding.recyclerView.adapter as LogEntriesAdapter).submitList(list)
    }
}
