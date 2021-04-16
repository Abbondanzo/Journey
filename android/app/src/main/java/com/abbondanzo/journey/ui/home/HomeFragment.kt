package com.abbondanzo.journey.ui.home

import android.os.Bundle
import android.view.View
import androidx.lifecycle.observe
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentHomeBinding
import com.abbondanzo.journey.ui.base.BaseFragment

class HomeFragment : BaseFragment<HomeViewModel>(R.layout.fragment_home) {

    private val binding by lazy { FragmentHomeBinding.bind(requireView()) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = getFragmentViewModel()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewModel.text.observe(viewLifecycleOwner, this::setText)
    }

    private fun setText(text: String) {
        binding.textHome.text = text
    }
}
