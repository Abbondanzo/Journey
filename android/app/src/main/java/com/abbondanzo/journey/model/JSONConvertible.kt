package com.abbondanzo.journey.model

import com.google.gson.Gson

interface JSONConvertible {
    fun toJSON(): String = Gson().toJson(this)

    companion object {
        inline fun <reified T : JSONConvertible> String.toObject(): T =
            Gson().fromJson(this, T::class.java)
    }
}
