package `in`.wavemusic.premium

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.ryanheise.audioservice.AudioServiceActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: AudioServiceActivity() {
    private val SCREEN_CHANNEL = "in.wavemusic.premium/screen"
    private val PLAYBACK_CHANNEL_ID = "in.wavemusic.premium.playback_v3"

    // Explicitly reference notification icon so compiler retains it
    private val keepPlaybackIcon = R.drawable.ic_stat_music

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createPlaybackNotificationChannel()
    }

    private fun createPlaybackNotificationChannel() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                
                // Clean up deprecated channels so OEM skins don't inherit old muted/hidden preferences
                try {
                    notificationManager.deleteNotificationChannel("in.wavemusic.premium.playback")
                    notificationManager.deleteNotificationChannel("in.wavemusic.premium.playback_v2")
                } catch (ignored: Exception) {}

                val channel = NotificationChannel(
                    PLAYBACK_CHANNEL_ID,
                    "Jalra Music Playback",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Music playback controls on Lock Screen, Notification Shade & Bluetooth"
                    lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                    setShowBadge(true)
                    setSound(null, null)
                    enableVibration(false)
                }
                notificationManager.createNotificationChannel(channel)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SCREEN_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "keepScreenOn" -> {
                    val enable = call.argument<Boolean>("enable") ?: true
                    if (enable) {
                        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    } else {
                        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    }
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }
}
