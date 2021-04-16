package com.abbondanzo.journey.model

import org.joda.time.DateTimeZone

data class Entry(
    val id: Long,
    val title: String,
    val body: String,
    val date: DateTimeZone,
    val location: Location
)
