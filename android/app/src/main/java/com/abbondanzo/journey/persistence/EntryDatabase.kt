package com.abbondanzo.journey.persistence

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.abbondanzo.journey.model.Location
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import org.joda.time.DateTimeZone

@Database(entities = [EntryEntity::class], version = 1, exportSchema = false)
@TypeConverters(Converters::class)
abstract class EntryDatabase : RoomDatabase() {
    abstract fun entryDao(): EntryDao

    private class EntryDatabaseCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {

        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch {
                    populateDatabase(database.entryDao())
                }
            }
        }

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

    companion object {
        @Volatile
        private var INSTANCE: EntryDatabase? = null

        fun getDatabase(
            context: Context, scope: CoroutineScope
        ): EntryDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    EntryDatabase::class.java,
                    "entry_database"
                )
                    .addCallback(EntryDatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                // return instance
                instance
            }
        }
    }
}
