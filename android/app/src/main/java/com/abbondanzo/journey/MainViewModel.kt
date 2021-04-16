package com.abbondanzo.journey

import android.graphics.*
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.abbondanzo.journey.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject


@HiltViewModel
internal class MainViewModel @Inject constructor(private val repository: ProfileRepository) :
    ViewModel() {
    private val _toolbarUsername = MutableLiveData<String>()
    val toolbarUsername: LiveData<String> = _toolbarUsername
    private val _toolbarLocation = MutableLiveData<String>()
    val toolbarLocation: LiveData<String> = _toolbarLocation
    private val _toolbarProfilePicture = MutableLiveData<Bitmap>()
    val toolbarProfilePicture: LiveData<Bitmap> = _toolbarProfilePicture

    init {
        _toolbarUsername.value = "Peter Abbondanzo"
        _toolbarLocation.value = "Boston, MA"
        _toolbarProfilePicture.value = getCroppedProfilePicture()
    }

    private fun getCroppedProfilePicture(): Bitmap? {
        val bitmap = repository.getProfilePicture() ?: return null

        // Get smallest dimension
        val diameter = if (bitmap.height > bitmap.width) bitmap.width else bitmap.height
        val output = Bitmap.createBitmap(diameter, diameter, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val color = -0xbdbdbe
        val paint = Paint()
        val rect = Rect(0, 0, diameter, diameter)

        paint.isAntiAlias = true
        canvas.drawARGB(0, 0, 0, 0)
        paint.color = color

        canvas.drawCircle(
            (diameter / 2).toFloat(), (diameter / 2).toFloat(),
            (diameter / 2).toFloat(), paint
        )
        paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(bitmap, rect, rect, paint)

        return output
    }
}
