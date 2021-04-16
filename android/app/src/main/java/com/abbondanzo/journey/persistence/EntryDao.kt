package com.abbondanzo.journey.persistence

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.abbondanzo.journey.model.Entry
import kotlinx.coroutines.flow.Flow

@Dao
interface EntryDao {

    @Query("SELECT * FROM entry ORDER BY id ASC")
    fun getEntries(): Flow<List<EntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntry(entry: EntryEntity)

    @Query("DELETE FROM entry WHERE id = :id")
    suspend fun deleteEntry(id: Long)

    @Query("DELETE FROM entry")
    suspend fun deleteAll()
}
