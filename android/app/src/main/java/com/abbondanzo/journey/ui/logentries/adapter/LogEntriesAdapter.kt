package com.abbondanzo.journey.ui.logentries.adapter

import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter

internal class LogEntriesAdapter : ListAdapter<LogEntryListItem, LogEntryViewHolder>(DIFF_UTIL) {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LogEntryViewHolder {
        return when (viewType) {
            LOG_ENTRY_LIST_ITEM -> LogEntryViewHolder.create(parent)
            else -> throw IllegalStateException()
        }
    }

    override fun onBindViewHolder(holder: LogEntryViewHolder, position: Int) {
        getItem(position).apply {
            holder.bind(this)
        }
    }

    companion object {
        private const val LOG_ENTRY_LIST_ITEM = 0

        private val DIFF_UTIL = object : DiffUtil.ItemCallback<LogEntryListItem>() {
            override fun areItemsTheSame(oldItem: LogEntryListItem, newItem: LogEntryListItem): Boolean {
                return oldItem.areItemsTheSame(newItem)
            }
            override fun areContentsTheSame(oldItem: LogEntryListItem, newItem: LogEntryListItem): Boolean {
                return oldItem.areContentsTheSame(newItem)
            }

        }
    }



}
