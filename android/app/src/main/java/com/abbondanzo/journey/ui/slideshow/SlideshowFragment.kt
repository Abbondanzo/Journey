package com.abbondanzo.journey.ui.slideshow

import android.os.Bundle
import android.view.View
import androidx.lifecycle.observe
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentSlideshowBinding
import com.abbondanzo.journey.ui.base.BaseFragment

class SlideshowFragment : BaseFragment<SlideshowViewModel>(R.layout.fragment_slideshow) {

    private val binding by lazy { FragmentSlideshowBinding.bind(requireView()) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = getFragmentViewModel()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewModel.text.observe(viewLifecycleOwner, this::setText)
    }

    private fun setText(text: String) {
        binding.textSlideshow.text = text
    }
}
