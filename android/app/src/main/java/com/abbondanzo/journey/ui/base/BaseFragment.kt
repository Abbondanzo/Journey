package com.abbondanzo.journey.ui.base

import android.os.Bundle
import androidx.annotation.LayoutRes
import androidx.lifecycle.ViewModel
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider

abstract class BaseFragment<VM : ViewModel>(
    @LayoutRes contentLayoutId: Int = 0
) : Fragment(contentLayoutId) {

    protected lateinit var viewModel: VM

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }


    inline fun <reified VM : ViewModel> getFragmentViewModel(): VM =
        ViewModelProvider(this).get(VM::class.java)

}
