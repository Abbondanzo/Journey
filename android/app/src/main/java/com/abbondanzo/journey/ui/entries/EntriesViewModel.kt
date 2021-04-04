package com.abbondanzo.journey.ui.entries

import androidx.lifecycle.*
import com.abbondanzo.journey.model.Entry
import com.abbondanzo.journey.repository.EntryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
internal class EntriesViewModel @Inject constructor(private val repository: EntryRepository) :
    ViewModel() {
    private val _logEntries = repository.getEntries().asLiveData()
    val entries: LiveData<List<Entry>> = _logEntries

    fun insert(entry: Entry) = viewModelScope.launch {
        repository.addEntry(entry)
    }
}
