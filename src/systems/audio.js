// Audio Manager - handles BGM and SFX across scenes

class AudioManagerClass {
  constructor() {
    this.currentBgm = null;
    this.currentBgmKey = null;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;
    this.muted = false;
    this.scene = null;
    this.initialized = false;
  }

  // Call this once from BootScene after audio is loaded
  init(scene) {
    this.scene = scene;
    this.initialized = true;

    // Load saved preferences
    try {
      const saved = localStorage.getItem('audioPrefs');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.bgmVolume = prefs.bgmVolume ?? 0.5;
        this.sfxVolume = prefs.sfxVolume ?? 0.7;
        this.muted = prefs.muted ?? false;
      }
    } catch (e) {
      // Ignore errors
    }

  }

  // Update scene reference (call when changing scenes)
  setScene(scene) {
    this.scene = scene;
  }

  // Save preferences
  savePrefs() {
    try {
      localStorage.setItem('audioPrefs', JSON.stringify({
        bgmVolume: this.bgmVolume,
        sfxVolume: this.sfxVolume,
        muted: this.muted,
      }));
    } catch (e) {
      // Ignore errors
    }
  }

  // Play background music with crossfade
  playBgm(key, config = {}) {
    if (!this.scene || !this.initialized) return;

    const { fadeIn = 1000, loop = true } = config;

    // Don't restart if same track
    if (this.currentBgmKey === key && this.currentBgm?.isPlaying) {
      return;
    }

    // Stop current BGM with fade
    if (this.currentBgm) {
      const oldBgm = this.currentBgm;
      this.scene.tweens.add({
        targets: oldBgm,
        volume: 0,
        duration: 500,
        onComplete: () => {
          oldBgm.stop();
          oldBgm.destroy();
        }
      });
      this.currentBgm = null;
    }

    // Start new BGM
    try {
      // Check if audio is in the cache (not sound.get which checks active instances)
      if (!this.scene.cache.audio.exists(key)) {
        console.warn('Audio not in cache:', key);
        return;
      }

      this.currentBgm = this.scene.sound.add(key, {
        volume: 0,
        loop,
      });

      this.currentBgmKey = key;

      if (!this.muted) {
        this.currentBgm.play();
        this.scene.tweens.add({
          targets: this.currentBgm,
          volume: this.bgmVolume,
          duration: fadeIn,
        });
      }
    } catch (e) {
      console.warn('Failed to play BGM:', key, e);
    }
  }

  // Stop background music
  stopBgm(fadeOut = 500) {
    if (!this.currentBgm || !this.scene) return;

    this.scene.tweens.add({
      targets: this.currentBgm,
      volume: 0,
      duration: fadeOut,
      onComplete: () => {
        if (this.currentBgm) {
          this.currentBgm.stop();
          this.currentBgm = null;
          this.currentBgmKey = null;
        }
      }
    });
  }

  // Pause BGM (useful for special scenes)
  pauseBgm() {
    if (this.currentBgm?.isPlaying) {
      this.currentBgm.pause();
    }
  }

  // Resume BGM
  resumeBgm() {
    if (this.currentBgm?.isPaused && !this.muted) {
      this.currentBgm.resume();
    }
  }

  // Play sound effect (one-shot)
  playSfx(key, config = {}) {
    if (!this.scene || this.muted || !this.initialized) return;

    try {
      if (!this.scene.sound.get(key)) {
        return;
      }

      this.scene.sound.play(key, {
        volume: this.sfxVolume * (config.volume || 1),
        ...config,
      });
    } catch (e) {
      console.warn('Failed to play SFX:', key, e);
    }
  }

  // Set BGM volume
  setBgmVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.currentBgm && !this.muted) {
      this.currentBgm.setVolume(this.bgmVolume);
    }
    this.savePrefs();
  }

  // Set SFX volume
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.savePrefs();
  }

  // Toggle mute
  toggleMute() {
    this.muted = !this.muted;

    if (this.muted) {
      if (this.currentBgm) {
        this.currentBgm.pause();
      }
    } else {
      if (this.currentBgm) {
        this.currentBgm.resume();
      }
    }

    this.savePrefs();
    return this.muted;
  }

  // Check if muted
  isMuted() {
    return this.muted;
  }
}

// Singleton instance
export const AudioManager = new AudioManagerClass();

// BGM keys for easy reference
export const BGM = {
  PORT: 'bgm_port',
  MENU: 'bgm_menu',
  BATTLE: 'bgm_battle',
  VICTORY: 'bgm_victory',
  GIFT: 'bgm_gift',
};
