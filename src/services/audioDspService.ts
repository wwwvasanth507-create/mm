import { EqualizerSettings } from '@/types/music';

/**
 * Audiophile-Grade Digital Signal Processing (DSP) Engine
 * Inspired by Apple Music Studio Master & Dolby Atmos Spatial Audio
 *
 * Implements:
 * 1. 5-Band High-Definition Parametric Equalizer (Sub-Bass, Kick/Bass Punch, Body, Vocal Clarity, Treble Air)
 * 2. 3D Binaural Haas Spatial Surround Virtualizer (Expansive soundstage like Dolby Cinema)
 * 3. Studio Dynamics Compressor & Peak Limiter (Prevents clipping, boosts micro-dynamics)
 * 4. Real-time AnalyserNode for spectrum visualization
 */

class AudioDspEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private attachedAudioElement: HTMLAudioElement | null = null;

  // Equalizer Filters
  private subBassFilter: BiquadFilterNode | null = null;
  private bassPunchFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private vocalFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  // Dolby Spatial Surround Nodes
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private directGainL: GainNode | null = null;
  private directGainR: GainNode | null = null;
  private crossDelayL: DelayNode | null = null;
  private crossDelayR: DelayNode | null = null;
  private crossFilterL: BiquadFilterNode | null = null;
  private crossFilterR: BiquadFilterNode | null = null;
  private crossGainL: GainNode | null = null;
  private crossGainR: GainNode | null = null;

  // Mastering Dynamics & Output
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isInitialized = false;
  private frequencyDataBuffer: Uint8Array | null = null;

  /**
   * Initializes the Web Audio graph once attached to a media element
   */
  public attach(audioEl: HTMLAudioElement): boolean {
    if (this.attachedAudioElement === audioEl && this.isInitialized) {
      return true;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[AudioDSP] Web Audio API not supported in this browser.');
        return false;
      }

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass({ latencyHint: 'playback' });
      }

      const ctx = this.audioCtx;

      // Ensure single media element source node per HTMLAudioElement
      if (!this.sourceNode || this.attachedAudioElement !== audioEl) {
        this.sourceNode = ctx.createMediaElementSource(audioEl);
        this.attachedAudioElement = audioEl;
      }

      // 1. Sub-Bass Filter (Low-shelf @ 60Hz) - Deep chest rumble without mud
      this.subBassFilter = ctx.createBiquadFilter();
      this.subBassFilter.type = 'lowshelf';
      this.subBassFilter.frequency.setValueAtTime(60, ctx.currentTime);

      // 2. Bass Punch Filter (Peaking @ 150Hz, Q=1.1) - Tight kick drum & bassline punch
      this.bassPunchFilter = ctx.createBiquadFilter();
      this.bassPunchFilter.type = 'peaking';
      this.bassPunchFilter.frequency.setValueAtTime(150, ctx.currentTime);
      this.bassPunchFilter.Q.setValueAtTime(1.1, ctx.currentTime);

      // 3. Midrange Body (Peaking @ 1000Hz, Q=0.8) - Acoustic warmth & instrumental clarity
      this.midFilter = ctx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.setValueAtTime(1000, ctx.currentTime);
      this.midFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      // 4. Vocal Separation & Clarity (Peaking @ 3200Hz, Q=1.35) - Crystal-clear voice presence (Apple Music style)
      this.vocalFilter = ctx.createBiquadFilter();
      this.vocalFilter.type = 'peaking';
      this.vocalFilter.frequency.setValueAtTime(3200, ctx.currentTime);
      this.vocalFilter.Q.setValueAtTime(1.35, ctx.currentTime);

      // 5. Treble Air & Shimmer (High-shelf @ 10000Hz) - Ultra-clean highs, breath, cymbals (Lossless feel)
      this.trebleFilter = ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.setValueAtTime(10000, ctx.currentTime);

      // 6. Dolby 3D Spatial Audio Virtualizer (Mid/Side + Haas Acoustic Room Emulation)
      this.splitter = ctx.createChannelSplitter(2);
      this.merger = ctx.createChannelMerger(2);

      this.directGainL = ctx.createGain();
      this.directGainR = ctx.createGain();

      // Cross-feed delays to simulate natural binaural acoustic distance (~13.5ms)
      this.crossDelayL = ctx.createDelay(0.05);
      this.crossDelayL.delayTime.setValueAtTime(0.0135, ctx.currentTime);
      this.crossDelayR = ctx.createDelay(0.05);
      this.crossDelayR.delayTime.setValueAtTime(0.0135, ctx.currentTime);

      // Head-shadow dampening filter (~3800Hz low-pass) for spatial cross-feed
      this.crossFilterL = ctx.createBiquadFilter();
      this.crossFilterL.type = 'lowpass';
      this.crossFilterL.frequency.setValueAtTime(3800, ctx.currentTime);

      this.crossFilterR = ctx.createBiquadFilter();
      this.crossFilterR.type = 'lowpass';
      this.crossFilterR.frequency.setValueAtTime(3800, ctx.currentTime);

      // Cross-feed inverted phase gains (simulates 3D out-of-head stereo expansion)
      this.crossGainL = ctx.createGain();
      this.crossGainL.gain.setValueAtTime(-0.3, ctx.currentTime);

      this.crossGainR = ctx.createGain();
      this.crossGainR.gain.setValueAtTime(-0.3, ctx.currentTime);

      // 7. Studio Dynamics Compressor & Limiter (Apple Music Mastered Sound)
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, ctx.currentTime); // dB
      this.compressor.knee.setValueAtTime(12, ctx.currentTime); // dB
      this.compressor.ratio.setValueAtTime(3.2, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, ctx.currentTime); // 3ms
      this.compressor.release.setValueAtTime(0.22, ctx.currentTime); // 220ms

      // 8. Master Gain & Spectrum Analyser
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, ctx.currentTime);

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      this.frequencyDataBuffer = new Uint8Array(this.analyser.frequencyBinCount);

      // ── WIRING THE AUDIO GRAPH ─────────────────────────────────────────
      // EQ Chain: Source -> SubBass -> BassPunch -> Mid -> Vocal -> Treble
      this.sourceNode.connect(this.subBassFilter);
      this.subBassFilter.connect(this.bassPunchFilter);
      this.bassPunchFilter.connect(this.midFilter);
      this.midFilter.connect(this.vocalFilter);
      this.vocalFilter.connect(this.trebleFilter);

      // Spatial Surround Virtualizer:
      // Treble Out -> Splitter -> (Direct + Crossfeed) -> Merger
      this.trebleFilter.connect(this.splitter);

      // Direct Paths
      this.splitter.connect(this.directGainL, 0);
      this.directGainL.connect(this.merger, 0, 0);

      this.splitter.connect(this.directGainR, 1);
      this.directGainR.connect(this.merger, 0, 1);

      // Crossfeed L -> R
      this.splitter.connect(this.crossDelayL, 0);
      this.crossDelayL.connect(this.crossFilterL);
      this.crossFilterL.connect(this.crossGainL);
      this.crossGainL.connect(this.merger, 0, 1);

      // Crossfeed R -> L
      this.splitter.connect(this.crossDelayR, 1);
      this.crossDelayR.connect(this.crossFilterR);
      this.crossFilterR.connect(this.crossGainR);
      this.crossGainR.connect(this.merger, 0, 0);

      // Output Stage: Merger -> Compressor -> MasterGain -> Analyser -> Destination
      this.merger.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[AudioDSP] Web Audio initialization deferred or unavailable:', err);
      return false;
    }
  }

  /**
   * Resumes AudioContext on user interaction
   */
  public resume(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Applies EQ band gains and Dolby Spatial Audio Width in real-time
   */
  public applySettings(settings: EqualizerSettings, isDolbyEnabled: boolean): void {
    if (!this.audioCtx || !this.isInitialized) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const transitionTime = 0.05; // 50ms smooth interpolation, zero clicking

    // If Dolby Atmos is disabled, bypass spatial processing & keep clean stereo
    const effectiveWidth = isDolbyEnabled ? settings.spatialWidth : 0;

    // Apply 5-Band Equalizer
    if (this.subBassFilter) {
      this.subBassFilter.gain.setTargetAtTime(settings.subBass, now, transitionTime);
    }
    if (this.bassPunchFilter) {
      this.bassPunchFilter.gain.setTargetAtTime(settings.bassPunch, now, transitionTime);
    }
    if (this.midFilter) {
      this.midFilter.gain.setTargetAtTime(settings.mid, now, transitionTime);
    }
    if (this.vocalFilter) {
      this.vocalFilter.gain.setTargetAtTime(settings.vocal, now, transitionTime);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(settings.treble, now, transitionTime);
    }

    // Apply Spatial Surround Width
    // When width is 0: directGain = 1.0, crossGain = 0 (Pure clean stereo)
    // When width is 1.0: directGain = 1.08, crossGain = -0.38 (Huge cinematic surround)
    if (this.directGainL && this.directGainR && this.crossGainL && this.crossGainR) {
      const directLevel = 1.0 + effectiveWidth * 0.12;
      const crossLevel = -0.38 * effectiveWidth;

      this.directGainL.gain.setTargetAtTime(directLevel, now, transitionTime);
      this.directGainR.gain.setTargetAtTime(directLevel, now, transitionTime);
      this.crossGainL.gain.setTargetAtTime(crossLevel, now, transitionTime);
      this.crossGainR.gain.setTargetAtTime(crossLevel, now, transitionTime);
    }
  }

  /**
   * Returns live frequency data for music visualizer
   */
  public getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyDataBuffer) return null;
    this.analyser.getByteFrequencyData(this.frequencyDataBuffer as any);
    return this.frequencyDataBuffer;
  }
}

export const audioDsp = new AudioDspEngine();
