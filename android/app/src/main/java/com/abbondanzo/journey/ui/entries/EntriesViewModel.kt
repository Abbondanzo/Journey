package com.abbondanzo.journey.ui.entries

import androidx.lifecycle.*
import com.abbondanzo.journey.model.Entry
import com.abbondanzo.journey.repository.EntryRepository
import kotlinx.coroutines.launch

internal class EntriesViewModel(private val repository: EntryRepository) : ViewModel() {
    private val _logEntries = repository.getEntries().asLiveData()
    val entries: LiveData<List<Entry>> = _logEntries

    fun insert(entry: Entry) = viewModelScope.launch {
        repository.addEntry(entry)
    }

    companion object {
        internal class WordViewModelFactory(private val repository: EntryRepository) :
            ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                if (modelClass.isAssignableFrom(EntriesViewModel::class.java)) {
                    @Suppress("UNCHECKED_CAST")
                    return EntriesViewModel(repository) as T
                }
                throw IllegalArgumentException("Unknown ViewModel class")
            }
        }
    }
}
