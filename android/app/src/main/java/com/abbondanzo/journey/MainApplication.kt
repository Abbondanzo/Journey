package com.abbondanzo.journey

import android.app.Application
import com.abbondanzo.journey.persistence.EntryDatabase
import com.abbondanzo.journey.repository.EntryRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

class MainApplication : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob())

    private val database by lazy { EntryDatabase.getDatabase(this, applicationScope) }
    val repository by lazy { EntryRepository(database.entryDao()) }
}
