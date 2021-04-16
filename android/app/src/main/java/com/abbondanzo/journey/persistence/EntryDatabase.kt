package com.abbondanzo.journey.persistence

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.abbondanzo.journey.model.Location
import org.joda.time.DateTimeZone

@Database(entities = [EntryEntity::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class EntryDatabase : RoomDatabase() {
    abstract fun entryDao(): EntryDao

    companion object {
        suspend fun populateDatabase(entryDao: EntryDao) {
            // Delete all content here.
            entryDao.deleteAll()

            // Add sample entries
            entryDao.insertEntry(
                EntryEntity(
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
                )
            )
            entryDao.insertEntry(
                EntryEntity(
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
                )
            )
            entryDao.insertEntry(
                EntryEntity(
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
    }
}
