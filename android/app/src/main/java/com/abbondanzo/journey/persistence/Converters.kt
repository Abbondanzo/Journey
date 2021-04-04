package com.abbondanzo.journey.persistence

import androidx.room.TypeConverter
import com.abbondanzo.journey.model.JSONConvertible.Companion.toObject
import com.abbondanzo.journey.model.Location
import org.joda.convert.StringConvert
import org.joda.time.DateTimeZone

class Converters {
    @TypeConverter
    fun fromDateTimeString(value: String): DateTimeZone {
        return value.let { StringConvert.INSTANCE.convertFromString(DateTimeZone::class.java, it) }
    }

    @TypeConverter
    fun toDateTimeString(date: DateTimeZone): String {
        return StringConvert.INSTANCE.convertToString(date)
    }

    @TypeConverter
    fun fromLocationString(value: String): Location {
        return value.toObject()
    }

    @TypeConverter
    fun toLocationString(location: Location): String {
        return location.toJSON()
    }
}
