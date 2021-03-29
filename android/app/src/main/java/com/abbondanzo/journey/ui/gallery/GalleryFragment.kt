package com.abbondanzo.journey.ui.gallery

import android.os.Bundle
import android.view.View
import androidx.lifecycle.observe
import com.abbondanzo.journey.R
import com.abbondanzo.journey.databinding.FragmentGalleryBinding
import com.abbondanzo.journey.ui.base.BaseFragment

class GalleryFragment : BaseFragment<GalleryViewModel>(R.layout.fragment_gallery) {

    private val binding by lazy { FragmentGalleryBinding.bind(requireView()) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = getFragmentViewModel()
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewModel.text.observe(viewLifecycleOwner, this::setText)
    }

    private fun setText(text: String) {
        binding.textGallery.text = text
    }
}
