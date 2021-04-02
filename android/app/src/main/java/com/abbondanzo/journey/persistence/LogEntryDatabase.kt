package com.abbondanzo.journey.persistence

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase


@Database(entities = [LogEntryEntity::class], version = 1, exportSchema = false)
abstract class LogEntryDatabase : RoomDatabase() {
    abstract fun logEntryDao(): LogEntryDao

    companion object {
        // Singleton prevents multiple instances of database opening at the
        // same time.
        @Volatile
        private var INSTANCE: LogEntryDatabase? = null

        fun getDatabase(context: Context): LogEntryDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    LogEntryDatabase::class.java,
                    "log_entry_database"
                ).build()
                INSTANCE = instance
                // return instance
                instance
            }
        }
    }
}
