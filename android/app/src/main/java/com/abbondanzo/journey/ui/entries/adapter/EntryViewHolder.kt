package com.abbondanzo.journey.ui.entries.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.abbondanzo.journey.databinding.ListItemEntryBinding
import com.abbondanzo.journey.model.Entry

internal class EntryViewHolder(itemView: ListItemEntryBinding) :
    RecyclerView.ViewHolder(itemView.root) {

    private val title = itemView.textTitle
    private val subtitle = itemView.textSubtitle

    fun bind(item: Entry) {
        title.text = item.title
        subtitle.text = "${item.location.city} ${item.location.country}"
    }

    companion object {
        fun create(viewGroup: ViewGroup): EntryViewHolder {
            return EntryViewHolder(
                ListItemEntryBinding.inflate(
                    LayoutInflater.from(viewGroup.context),
                    viewGroup,
                    false
                )
            )
        }
    }
}
