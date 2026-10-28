package `in`.wavemusic.premium

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.WindowManager
import androidx.core.content.FileProvider
import com.ryanheise.audioservice.AudioServiceActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity: AudioServiceActivity() {
    private val SCREEN_CHANNEL = "in.wavemusic.premium/screen"
    private val UPDATER_CHANNEL = "in.wavemusic.premium/updater"
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

        // Screen management channel
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

        // In-app updater native channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, UPDATER_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "installApk" -> {
                    val filePath = call.argument<String>("filePath")
                    if (filePath.isNullOrEmpty()) {
                        result.error("INVALID_PATH", "APK file path cannot be empty", null)
                        return@setMethodCallHandler
                    }
                    try {
                        val file = File(filePath)
                        if (!file.exists()) {
                            result.error("FILE_NOT_FOUND", "APK file does not exist at $filePath", null)
                            return@setMethodCallHandler
                        }

                        // Check install unknown apps permission on Android 8.0 (API 26)+
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            if (!packageManager.canRequestPackageInstalls()) {
                                val settingsIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                                    data = Uri.parse("package:$packageName")
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                startActivity(settingsIntent)
                                result.success(false)
                                return@setMethodCallHandler
                            }
                        }

                        val apkUri = FileProvider.getUriForFile(
                            this@MainActivity,
                            "$packageName.fileprovider",
                            file
                        )

                        val installIntent = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(apkUri, "application/vnd.android.package-archive")
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(installIntent)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("INSTALL_ERROR", e.localizedMessage, null)
                    }
                }
                "canInstallApk" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        result.success(packageManager.canRequestPackageInstalls())
                    } else {
                        result.success(true)
                    }
                }
                "openInstallPermissionSettings" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val settingsIntent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                            data = Uri.parse("package:$packageName")
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(settingsIntent)
                        result.success(true)
                    } else {
                        result.success(true)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }
}
