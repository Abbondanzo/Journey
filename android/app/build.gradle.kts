import AndroidConfig.AndroidBuildType.RELEASE

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("kotlin-kapt")
}

android {
    compileSdkVersion(AndroidConfig.COMPILE_SDK_VERSION)
    buildToolsVersion(AndroidConfig.BUILD_TOOLS_VERSION)

    buildFeatures {
        viewBinding = true
    }

    defaultConfig {
        applicationId = "com.abbondanzo.journey"
        minSdkVersion(AndroidConfig.MIN_SDK_VERSION)
        targetSdkVersion(AndroidConfig.TARGET_SDK_VERSION)
        versionCode(1)
        versionName("1.0")

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        getByName(RELEASE) {
            minifyEnabled(false)
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation(Dependencies.JODA_TIME)

    implementation(Dependencies.Android.ACTIVITY_KTX)
    implementation(Dependencies.Android.CONSTRAINT_LAYOUT)
    implementation(Dependencies.Android.LIFECYCLE_LIVEDATA)
    implementation(Dependencies.Android.LIFECYCLE_VIEWMODEL)
    implementation(Dependencies.Android.MATERIAL)
    implementation(Dependencies.Android.NAVIGATION_FRAGMENT)
    implementation(Dependencies.Android.NAVIGATION_UI)

    api(Dependencies.Kotlin.COROUTINES_ANDROID)
    api(Dependencies.Kotlin.COROUTINES_CORE)
    implementation(Dependencies.Kotlin.STDLIB)

    implementation(Dependencies.Android.ROOM_KTX)
    kapt(Dependencies.Android.ROOM_COMPILER)
}
