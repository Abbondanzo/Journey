package com.abbondanzo.journey.ui.base

import androidx.annotation.LayoutRes
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

abstract class BaseFragment<VM : ViewModel>(
    @LayoutRes contentLayoutId: Int = 0
) : Fragment(contentLayoutId) {

    protected lateinit var viewModel: VM

    inline fun <reified VM : ViewModel> getFragmentViewModel(): VM =
        ViewModelProvider(this).get(VM::class.java)
}
