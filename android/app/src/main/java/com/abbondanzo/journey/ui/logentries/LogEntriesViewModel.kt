package com.abbondanzo.journey.ui.logentries

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.abbondanzo.journey.model.Location
import com.abbondanzo.journey.ui.logentries.adapter.LogEntryListItem
import org.joda.time.DateTimeZone

internal class LogEntriesViewModel : ViewModel() {

    private val _logEntries = MutableLiveData<List<LogEntryListItem>>().apply {
        value = listOf(
            LogEntryListItem(
                id = 1L,
                title = "Over the River and Thru the Woods",
                body = "Body contents",
                date = DateTimeZone.getDefault(),
                location = Location(
                    city = "Quito",
                    country = "Ecuador",
                    latitude = 0f,
                    longitude = 0f
                )
            ),
            LogEntryListItem(
                id = 2L,
                title = "Rise and Shine",
                body = "Body contents",
                date = DateTimeZone.getDefault(),
                location = Location(
                    city = "Paris",
                    country = "France",
                    latitude = 0f,
                    longitude = 0f
                )
            ),
            LogEntryListItem(
                id = 3L,
                title = "Two's a Crowd",
                body = "Body contents",
                date = DateTimeZone.getDefault(),
                location = Location(
                    city = "Melbourne",
                    country = "Australia",
                    latitude = 0f,
                    longitude = 0f
                )
            )
        )
    }
    val logEntries: LiveData<List<LogEntryListItem>> = _logEntries
}
