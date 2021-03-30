package com.abbondanzo.journey.ui.logentries.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.abbondanzo.journey.databinding.ListItemLogEntryBinding

internal class LogEntryViewHolder(itemView: ListItemLogEntryBinding) :
    RecyclerView.ViewHolder(itemView.root) {

    private val title = itemView.textTitle
    private val subtitle = itemView.textSubtitle

    fun bind(item: LogEntryListItem) {
        title.text = item.title
        subtitle.text = "${item.location.city} ${item.location.country}"
    }

    companion object {
        fun create(viewGroup: ViewGroup): LogEntryViewHolder {
            return LogEntryViewHolder(
                ListItemLogEntryBinding.inflate(
                    LayoutInflater.from(viewGroup.context),
                    viewGroup,
                    false
                )
            )
        }
    }
}
