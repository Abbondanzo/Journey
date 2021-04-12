object Dependencies {

    const val GSON = "com.google.code.gson:gson:${Versions.GSON}"
    const val JODA_TIME = "joda-time:joda-time:${Versions.JODA_TIME}"
    const val JODA_TIME_CONVERT = "org.joda:joda-convert:${Versions.JODA_TIME_CONVERT}"

    object Android {
        const val ACTIVITY_KTX = "androidx.activity:activity-ktx:${Versions.Android.ACTIVITY_KTX}"
        const val APP_COMPAT = "androidx.appcompat:appcompat:${Versions.Android.APP_COMPAT}"
        const val CONSTRAINT_LAYOUT = "androidx.constraintlayout:constraintlayout:${Versions.Android.CONSTRAINT_LAYOUT}"
        const val LIFECYCLE_LIVEDATA = "androidx.lifecycle:lifecycle-livedata-ktx:${Versions.Android.LIFECYCLE}"
        const val LIFECYCLE_VIEWMODEL = "androidx.lifecycle:lifecycle-viewmodel-ktx:${Versions.Android.LIFECYCLE}"
        const val MATERIAL = "com.google.android.material:material:${Versions.Android.MATERIAL}"
        const val NAVIGATION_FRAGMENT = "androidx.navigation:navigation-fragment-ktx:${Versions.Android.NAVIGATION}"
        const val NAVIGATION_UI = "androidx.navigation:navigation-ui-ktx:${Versions.Android.NAVIGATION}"
        const val ROOM_COMPILER = "androidx.room:room-compiler:${Versions.Android.ROOM}"
        const val ROOM_KTX = "androidx.room:room-ktx:${Versions.Android.ROOM}"
        const val ROOM_TESTING = "androidx.room:room-testing:${Versions.Android.ROOM}"
        const val VIEWPAGER = "androidx.viewpager:viewpager:${Versions.Android.VIEWPAGER}"

        object Test {
            const val ARCH = "androidx.arch.core:core-testing:${Versions.Android.Test.ARCH}"
            const val ESPRESSO = "androidx.test.espresso:espresso-core:${Versions.Android.Test.ESPRESSO}"
        }

        object Tooling {
            const val GRADLE = "com.android.tools.build:gradle:${Versions.Android.Tooling.GRADLE}"
        }
    }

    object Hilt {
        const val HILT_ANDROID = "com.google.dagger:hilt-android:${Versions.Hilt.HILT}"
        const val HILT_COMPILER = "com.google.dagger:hilt-compiler:${Versions.Hilt.HILT}"

        object Tooling {
            const val GRADLE = "com.google.dagger:hilt-android-gradle-plugin:${Versions.Hilt.HILT}"
        }
    }

    object Kotlin {
        const val COROUTINES_ANDROID = "org.jetbrains.kotlinx:kotlinx-coroutines-android:${Versions.Kotlin.COROUTINES}"
        const val COROUTINES_CORE = "org.jetbrains.kotlinx:kotlinx-coroutines-core:${Versions.Kotlin.COROUTINES}"
        const val STDLIB = "org.jetbrains.kotlin:kotlin-stdlib:${CoreVersions.KOTLIN}"

        object Tooling {
            const val GRADLE = "org.jetbrains.kotlin:kotlin-gradle-plugin:${CoreVersions.KOTLIN}"
        }
    }
}
