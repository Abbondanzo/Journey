package com.abbondanzo.journey.repository

import com.abbondanzo.journey.model.LogEntry
import com.abbondanzo.journey.persistence.LogEntryDao
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class LogEntryRepository(private val logEntryDao: LogEntryDao) {
    suspend fun getLogs(): Flow<List<LogEntry>> {
        return logEntryDao.getLogs().map { logs ->
            logs.map {
                LogEntry(
                    id = it.id,
                    title = it.title,
                    body = it.body,
                    date = it.date,
                    location = it.location
                )
            }
        }
    }
}
