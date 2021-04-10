package com.abbondanzo.journey.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.IOException
import javax.inject.Inject

internal class ProfileRepository @Inject constructor(@ApplicationContext private val context: Context) {

    fun getProfilePicture(): Bitmap? {
        return try {
            val bitmap = context.assets.open("profile_picture.png")
            BitmapFactory.decodeStream(bitmap)
        } catch (ex: IOException) {
            ex.printStackTrace()
            null
        }
    }
}
