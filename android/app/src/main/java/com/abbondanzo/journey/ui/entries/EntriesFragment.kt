package com.abbondanzo.journey.ui.entries

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.observe
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentEntriesBinding
import com.abbondanzo.journey.model.Entry
import com.abbondanzo.journey.ui.entries.adapter.EntriesAdapter
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
internal class EntriesFragment : Fragment(R.layout.fragment_entries) {

    private val viewModel: EntriesViewModel by viewModels()
    private val binding by lazy { FragmentEntriesBinding.bind(requireView()) }

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
