package com.abbondanzo.journey.ui.dashboard.entries.adapter

import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import com.abbondanzo.journey.model.Entry

internal class EntriesAdapter : ListAdapter<Entry, EntryViewHolder>(DIFF_UTIL) {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EntryViewHolder {
        return when (viewType) {
            LOG_ENTRY_LIST_ITEM -> EntryViewHolder.create(parent)
            else -> throw IllegalStateException()
        }
    }

    override fun onBindViewHolder(holder: EntryViewHolder, position: Int) {
        getItem(position).apply {
            holder.bind(this)
        }
    }

    companion object {
        private const val LOG_ENTRY_LIST_ITEM = 0

        private val DIFF_UTIL = object : DiffUtil.ItemCallback<Entry>() {
            override fun areItemsTheSame(oldItem: Entry, newItem: Entry): Boolean {
                return oldItem === newItem
            }

            override fun areContentsTheSame(oldItem: Entry, newItem: Entry): Boolean {
                return oldItem.id == newItem.id
            }
        }
    }
}
