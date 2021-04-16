package com.abbondanzo.journey.repository

import com.abbondanzo.journey.model.Entry
import com.abbondanzo.journey.persistence.EntryDao
import com.abbondanzo.journey.persistence.EntryEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

internal class EntryRepository @Inject constructor(private val entryDao: EntryDao) {
    fun getEntries(): Flow<List<Entry>> {
        return entryDao.getEntries().map { entries ->
            entries.map {
                Entry(
                    id = it.id,
                    title = it.title,
                    body = it.body,
                    date = it.date,
                    location = it.location
                )
            }
        }
    }

    suspend fun addEntry(entry: Entry) {
        entryDao.insertEntry(
            EntryEntity(
                id = entry.id,
                title = entry.title,
                body = entry.body,
                date = entry.date,
                location = entry.location
            )
        )
    }
}
