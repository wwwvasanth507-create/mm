package com.wavemusic.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WaveMediaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
