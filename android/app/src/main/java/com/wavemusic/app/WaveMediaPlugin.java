package com.wavemusic.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WaveMedia")
public class WaveMediaPlugin extends Plugin {

    private static WaveMediaPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void sendAction(String action, long position) {
        if (instance != null) {
            JSObject data = new JSObject();
            data.put("action", action);
            data.put("position", position);
            instance.notifyListeners("onMediaAction", data);
        }
    }

    @PluginMethod
    public void updatePlaybackState(PluginCall call) {
        String title = call.getString("title", "WaveMusic");
        String artist = call.getString("artist", "Unknown Artist");
        String album = call.getString("album", "");
        String artworkUrl = call.getString("artworkUrl", "");
        boolean isPlaying = Boolean.TRUE.equals(call.getBoolean("isPlaying", false));
        double positionSec = call.getDouble("position", 0.0);
        double durationSec = call.getDouble("duration", 0.0);

        Context context = getContext();
        if (context != null) {
            Intent intent = new Intent(context, WaveMediaService.class);
            intent.setAction(WaveMediaService.ACTION_UPDATE);
            intent.putExtra(WaveMediaService.EXTRA_TITLE, title);
            intent.putExtra(WaveMediaService.EXTRA_ARTIST, artist);
            intent.putExtra(WaveMediaService.EXTRA_ALBUM, album);
            intent.putExtra(WaveMediaService.EXTRA_ARTWORK, artworkUrl);
            intent.putExtra(WaveMediaService.EXTRA_IS_PLAYING, isPlaying);
            intent.putExtra(WaveMediaService.EXTRA_POSITION, (long) (positionSec * 1000));
            intent.putExtra(WaveMediaService.EXTRA_DURATION, (long) (durationSec * 1000));

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent);
                } else {
                    context.startService(intent);
                }
            } catch (Exception e) {
                call.reject("Failed to start or update media service: " + e.getMessage());
                return;
            }
        }

        call.resolve();
    }

    @PluginMethod
    public void stopPlayback(PluginCall call) {
        WaveMediaService service = WaveMediaService.getInstance();
        if (service != null) {
            service.stopPlaybackService();
        } else {
            Context context = getContext();
            if (context != null) {
                Intent intent = new Intent(context, WaveMediaService.class);
                intent.setAction(WaveMediaService.ACTION_STOP);
                context.stopService(intent);
            }
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.handleOnDestroy();
    }
}
