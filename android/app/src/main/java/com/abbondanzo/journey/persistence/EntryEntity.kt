package com.abbondanzo.journey.persistence

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.abbondanzo.journey.model.Location
import org.joda.time.DateTimeZone

@Entity(tableName = "entry")
class EntryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long,
    @ColumnInfo(name = "title") val title: String,
    @ColumnInfo(name = "body") val body: String,
    @ColumnInfo(name = "date") val date: DateTimeZone,
    @ColumnInfo(name = "location") val location: Location
)
