package com.abbondanzo.journey.di

import android.content.Context
import androidx.room.Room
import com.abbondanzo.journey.persistence.EntryDao
import com.abbondanzo.journey.persistence.EntryDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class DatabaseModule {

    @Provides
    @Singleton
    fun provideEntryDatabase(@ApplicationContext context: Context): EntryDatabase {
        return Room.databaseBuilder(
            context,
            EntryDatabase::class.java,
            "entry_database"
        ).build()
    }

    @Provides
    fun provideEntryDao(entryDatabase: EntryDatabase): EntryDao {
        return entryDatabase.entryDao()
    }
}
