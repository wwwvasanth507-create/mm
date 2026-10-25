package com.wavemusic.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class WaveMediaService extends Service {

    public static final String CHANNEL_ID = "wavemusic_channel_playback";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_UPDATE = "com.wavemusic.app.ACTION_UPDATE";
    public static final String ACTION_STOP = "com.wavemusic.app.ACTION_STOP";
    public static final String ACTION_PLAY = "com.wavemusic.app.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.wavemusic.app.ACTION_PAUSE";
    public static final String ACTION_NEXT = "com.wavemusic.app.ACTION_NEXT";
    public static final String ACTION_PREV = "com.wavemusic.app.ACTION_PREV";

    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_ALBUM = "extra_album";
    public static final String EXTRA_ARTWORK = "extra_artwork";
    public static final String EXTRA_IS_PLAYING = "extra_is_playing";
    public static final String EXTRA_POSITION = "extra_position";
    public static final String EXTRA_DURATION = "extra_duration";

    private static WaveMediaService instance;

    private MediaSessionCompat mediaSession;
    private NotificationManager notificationManager;
    private AudioManager audioManager;
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private final ExecutorService artworkExecutor = Executors.newSingleThreadExecutor();

    private String currentTitle = "WaveMusic";
    private String currentArtist = "Premium Audio";
    private String currentAlbum = "";
    private String currentArtworkUrl = "";
    private Bitmap currentArtworkBitmap = null;
    private boolean isPlaying = false;
    private long currentPositionMs = 0;
    private long currentDurationMs = 0;

    private boolean isNoisyReceiverRegistered = false;

    private final BroadcastReceiver noisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                WaveMediaPlugin.sendAction("pause", 0);
            }
        }
    };

    private final AudioManager.OnAudioFocusChangeListener audioFocusListener = focusChange -> {
        if (focusChange == AudioManager.AUDIOFOCUS_LOSS || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
            WaveMediaPlugin.sendAction("pause", 0);
        }
    };

    public static WaveMediaService getInstance() {
        return instance;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        // Power & Wifi Locks for seamless uninterrupted background playback
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "WaveMusic:WakeLock");
            wakeLock.setReferenceCounted(false);
        }

        WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wm != null) {
            wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "WaveMusic:WifiLock");
            wifiLock.setReferenceCounted(false);
        }

        createNotificationChannel();
        initMediaSession();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "WaveMusic Playback Controls",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active playback controls on lock screen and notification shade");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(this, "WaveMusicMediaSession");
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                WaveMediaPlugin.sendAction("play", 0);
            }

            @Override
            public void onPause() {
                WaveMediaPlugin.sendAction("pause", 0);
            }

            @Override
            public void onSkipToNext() {
                WaveMediaPlugin.sendAction("next", 0);
            }

            @Override
            public void onSkipToPrevious() {
                WaveMediaPlugin.sendAction("previous", 0);
            }

            @Override
            public void onSeekTo(long pos) {
                WaveMediaPlugin.sendAction("seek", pos / 1000);
            }

            @Override
            public void onStop() {
                WaveMediaPlugin.sendAction("pause", 0);
                stopPlaybackService();
            }
        });

        mediaSession.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;

        String action = intent.getAction();
        if (action == null) return START_STICKY;

        switch (action) {
            case ACTION_PLAY:
                WaveMediaPlugin.sendAction("play", 0);
                break;
            case ACTION_PAUSE:
                WaveMediaPlugin.sendAction("pause", 0);
                break;
            case ACTION_NEXT:
                WaveMediaPlugin.sendAction("next", 0);
                break;
            case ACTION_PREV:
                WaveMediaPlugin.sendAction("previous", 0);
                break;
            case ACTION_STOP:
                WaveMediaPlugin.sendAction("pause", 0);
                stopPlaybackService();
                break;
            case ACTION_UPDATE:
                handleUpdateIntent(intent);
                break;
        }

        return START_STICKY;
    }

    private void handleUpdateIntent(Intent intent) {
        currentTitle = intent.getStringExtra(EXTRA_TITLE);
        if (currentTitle == null || currentTitle.isEmpty()) currentTitle = "WaveMusic";

        currentArtist = intent.getStringExtra(EXTRA_ARTIST);
        if (currentArtist == null || currentArtist.isEmpty()) currentArtist = "Unknown Artist";

        currentAlbum = intent.getStringExtra(EXTRA_ALBUM);
        if (currentAlbum == null) currentAlbum = "";

        isPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, false);
        currentPositionMs = intent.getLongExtra(EXTRA_POSITION, 0);
        currentDurationMs = intent.getLongExtra(EXTRA_DURATION, 0);

        String newArtworkUrl = intent.getStringExtra(EXTRA_ARTWORK);

        manageLocksAndAudio(isPlaying);

        if (newArtworkUrl != null && !newArtworkUrl.equals(currentArtworkUrl)) {
            currentArtworkUrl = newArtworkUrl;
            loadArtworkAndRefresh(currentArtworkUrl);
        } else {
            updateSessionAndNotification();
        }
    }

    private void manageLocksAndAudio(boolean playing) {
        if (playing) {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(12 * 60 * 60 * 1000L); // Max 12 hours safety
            }
            if (wifiLock != null && !wifiLock.isHeld()) {
                wifiLock.acquire();
            }
            registerNoisyReceiver();
            requestAudioFocus();
        } else {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
            }
            unregisterNoisyReceiver();
        }
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            AudioFocusRequest request = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setOnAudioFocusChangeListener(audioFocusListener)
                    .build();
            audioManager.requestAudioFocus(request);
        } else {
            audioManager.requestAudioFocus(audioFocusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    private void registerNoisyReceiver() {
        if (!isNoisyReceiverRegistered) {
            IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            registerReceiver(noisyReceiver, filter);
            isNoisyReceiverRegistered = true;
        }
    }

    private void unregisterNoisyReceiver() {
        if (isNoisyReceiverRegistered) {
            try {
                unregisterReceiver(noisyReceiver);
            } catch (Exception ignored) {}
            isNoisyReceiverRegistered = false;
        }
    }

    private void loadArtworkAndRefresh(String artworkUrl) {
        artworkExecutor.execute(() -> {
            Bitmap bmp = null;
            if (artworkUrl != null && (artworkUrl.startsWith("http://") || artworkUrl.startsWith("https://"))) {
                try {
                    URL url = new URL(artworkUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.setConnectTimeout(5000);
                    connection.setReadTimeout(5000);
                    connection.connect();
                    InputStream input = connection.getInputStream();
                    bmp = BitmapFactory.decodeStream(input);
                } catch (Exception ignored) {}
            }
            currentArtworkBitmap = bmp;
            updateSessionAndNotification();
        });
    }

    private void updateSessionAndNotification() {
        long actions = PlaybackStateCompat.ACTION_PLAY
                | PlaybackStateCompat.ACTION_PAUSE
                | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                | PlaybackStateCompat.ACTION_SEEK_TO
                | PlaybackStateCompat.ACTION_STOP;

        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, currentPositionMs, isPlaying ? 1.0f : 0.0f);

        mediaSession.setPlaybackState(stateBuilder.build());

        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, currentDurationMs);

        if (currentArtworkBitmap != null) {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentArtworkBitmap);
        }

        mediaSession.setMetadata(metaBuilder.build());

        Notification notification = buildNotification();
        startForeground(NOTIFICATION_ID, notification);
    }

    private Notification buildNotification() {
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
                this,
                0,
                contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent prevIntent = new Intent(this, WaveMediaService.class).setAction(ACTION_PREV);
        PendingIntent prevPendingIntent = PendingIntent.getService(
                this,
                1,
                prevIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent playPauseIntent = new Intent(this, WaveMediaService.class).setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent playPausePendingIntent = PendingIntent.getService(
                this,
                2,
                playPauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent nextIntent = new Intent(this, WaveMediaService.class).setAction(ACTION_NEXT);
        PendingIntent nextPendingIntent = PendingIntent.getService(
                this,
                3,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        int playPauseIcon = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playPauseTitle = isPlaying ? "Pause" : "Play";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist + (currentAlbum.isEmpty() ? "" : " • " + currentAlbum))
                .setContentIntent(contentPendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(isPlaying)
                .addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent)
                .addAction(playPauseIcon, playPauseTitle, playPausePendingIntent)
                .addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent)
                .setStyle(new MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2)
                );

        if (currentArtworkBitmap != null) {
            builder.setLargeIcon(currentArtworkBitmap);
        }

        return builder.build();
    }

    public void stopPlaybackService() {
        manageLocksAndAudio(false);
        if (mediaSession != null) {
            mediaSession.setActive(false);
        }
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        manageLocksAndAudio(false);
        if (mediaSession != null) {
            mediaSession.release();
        }
        artworkExecutor.shutdown();
        instance = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
