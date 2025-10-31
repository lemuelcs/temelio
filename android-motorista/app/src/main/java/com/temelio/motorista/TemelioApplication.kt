package com.temelio.motorista

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class TemelioApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
