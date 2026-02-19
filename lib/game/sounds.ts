// Initialize sound state from localStorage or default to true
let soundEnabled = typeof window !== 'undefined' 
  ? (localStorage.getItem('soundEnabled') !== 'false')
  : true;

// Reusable audio context
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      return null;
    }
  }
  
  // Resume context if suspended (required by some browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(err => console.error('Failed to resume AudioContext:', err));
  }
  
  return audioContext;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('soundEnabled', String(enabled));
  }
  
  // Initialize audio context when enabling sound
  if (enabled) {
    getAudioContext();
  }
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playCorrectSound() {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // High-pitched "ding" for correct answer
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.error('Audio error:', error);
  }
}

export function playIncorrectSound() {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Low buzz for incorrect answer
    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error('Audio error:', error);
  }
}

export function playComboSound(combo: number) {
  if (!soundEnabled) return;
  
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Increasing pitch based on combo
    oscillator.frequency.value = 600 + (combo * 50);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.error('Audio error:', error);
  }
}
