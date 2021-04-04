package com.abbondanzo.journey

import android.app.Application
import com.abbondanzo.journey.persistence.EntryDao
import com.abbondanzo.journey.persistence.EntryDatabase
import dagger.hilt.android.HiltAndroidApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltAndroidApp
class MainApplication : Application() {

    @Inject
    lateinit var entryDao: EntryDao

    private val applicationScope = CoroutineScope(SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        applicationScope.launch {
            EntryDatabase.populateDatabase(entryDao)
        }
    }
}
