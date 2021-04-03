package com.abbondanzo.journey.ui.entries

import android.os.Bundle
import android.view.View
import androidx.lifecycle.observe
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentEntriesBinding
import com.abbondanzo.journey.model.Entry
import com.abbondanzo.journey.ui.base.BaseFragment
import com.abbondanzo.journey.ui.entries.adapter.EntriesAdapter

internal class EntriesFragment : BaseFragment<EntriesViewModel>(R.layout.fragment_entries) {

    private val binding by lazy { FragmentEntriesBinding.bind(requireView()) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = getFragmentViewModel()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        viewModel.entries.observe(viewLifecycleOwner, this::handleEntries)
    }

    private fun setupRecyclerView() {
        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(context)
            adapter = EntriesAdapter()
            addItemDecoration(DividerItemDecoration(context, DividerItemDecoration.VERTICAL))
        }
    }

    private fun handleEntries(list: List<Entry>) {
        (binding.recyclerView.adapter as EntriesAdapter).submitList(list)
    }
}
