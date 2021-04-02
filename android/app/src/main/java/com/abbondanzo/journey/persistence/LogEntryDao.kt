package com.abbondanzo.journey.persistence

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.abbondanzo.journey.model.LogEntry
import kotlinx.coroutines.flow.Flow

@Dao
interface LogEntryDao {

    @Query("SELECT * FROM log_entry ORDER BY id ASC")
    suspend fun getLogs(): Flow<List<LogEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(logEntry: LogEntry)

    @Query("DELETE FROM log_entry WHERE id = :id")
    suspend fun deleteLog(id: Long)
}
