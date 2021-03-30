package com.abbondanzo.journey.ui.logentries.adapter

import com.abbondanzo.journey.model.Location
import org.joda.time.DateTimeZone

internal data class LogEntryListItem(
    val id: Long,
    val title: String,
    val body: String,
    val date: DateTimeZone,
    val location: Location
) {
    fun areContentsTheSame(other: LogEntryListItem): Boolean {
        return this.id == other.id && this.title == other.title && this.body == other.body && this.date == other.date && this.location == other.location
    }

    fun areItemsTheSame(other: LogEntryListItem): Boolean {
        return this.id == other.id
    }
}
