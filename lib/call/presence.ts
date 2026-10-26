// Lets the phone know a call is on. The screen stays awake (Screen Wake Lock, taken again whenever the page comes
// back), the lock screen and notification shade show "On a call with …" (Media Session, which needs a playing
// <audio> element, so a silent loop plays beside the Web Audio call), and the tab title carries the timer.
// The call's own audio stays on Web Audio, so echo cancellation is untouched.

import type { CallSnapshot } from "./types";

const DOT = "● ";
const TITLE_PREFIX = /^● \d+:\d\d · /;

export interface Presence {
  /** Call inside the tap that starts the call, before any await, or iOS won't play the audio. */
  begin(): void;
  update(snap: CallSnapshot): void;
  end(): void;
}

export function createPresence({
  name,
  onMute,
  onHangUp,
}: {
  name: string;
  onMute: (muted: boolean) => void;
  onHangUp: () => void;
}): Presence {
  let lock: WakeLockSentinel | null = null;
  let audio: HTMLAudioElement | null = null;
  let titleTimer: ReturnType<typeof setInterval> | undefined;
  let startedAt: number | null = null;
  let muted = false;
  let on = false;

  const wake = async () => {
    if (!on || lock || document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
    try {
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => (lock = null));
      if (!on) void lock.release();
    } catch {
      // Refused (low battery, or the page isn't visible): the next visibility change tries again.
    }
  };
  const onVisible = () => {
    void wake();
    if (on && audio?.paused) void audio.play().catch(() => undefined);
  };

  const session = () => (typeof navigator !== "undefined" && "mediaSession" in navigator ? navigator.mediaSession : null);
  const setAction = (action: string, handler: (() => void) | null) => {
    try {
      session()?.setActionHandler(action as MediaSessionAction, handler);
    } catch {
      // Not every browser knows "hangup" and "togglemicrophone".
    }
  };
  const showCard = () => {
    const ms = session();
    if (!ms) return;
    ms.metadata = new MediaMetadata({
      title: `On a call with ${name}`,
      artist: muted ? "Callio · You're muted" : "Callio",
      artwork: [{ src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }],
    });
    ms.playbackState = muted ? "paused" : "playing";
    try {
      ms.setMicrophoneActive?.(!muted);
    } catch {}
  };

  const tickTitle = () => {
    const bare = document.title.replace(TITLE_PREFIX, "");
    if (!on || startedAt === null) {
      document.title = bare;
      return;
    }
    const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    document.title = `${DOT}${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} · ${bare}`;
  };

  return {
    begin() {
      if (on) return;
      on = true;
      audio = new Audio(silentWav());
      audio.loop = true;
      audio.setAttribute("playsinline", "");
      void audio.play().catch(() => undefined);
      showCard();
      // The lock-screen play/pause mutes and unmutes; hang-up shows where the platform has one.
      setAction("pause", () => onMute(true));
      setAction("play", () => onMute(false));
      setAction("togglemicrophone", () => onMute(!muted));
      setAction("hangup", onHangUp);
      setAction("stop", onHangUp);
      document.addEventListener("visibilitychange", onVisible);
      void wake();
    },

    update(snap) {
      if (!on) return;
      if (snap.muted !== muted) {
        muted = snap.muted;
        showCard();
      }
      if (snap.startedAt !== startedAt) {
        startedAt = snap.startedAt;
        clearInterval(titleTimer);
        if (startedAt !== null) titleTimer = setInterval(tickTitle, 1000);
        tickTitle();
      }
    },

    end() {
      if (!on) return;
      on = false;
      clearInterval(titleTimer);
      startedAt = null;
      tickTitle();
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => undefined);
      lock = null;
      audio?.pause();
      if (audio) URL.revokeObjectURL(audio.src);
      audio = null;
      for (const a of ["pause", "play", "togglemicrophone", "hangup", "stop"]) setAction(a, null);
      const ms = session();
      if (ms) {
        ms.metadata = null;
        ms.playbackState = "none";
      }
    },
  };
}

/** Ten seconds of silence: Android only shows a media card for media longer than five. */
function silentWav() {
  const rate = 8000;
  const samples = rate * 10;
  const view = new DataView(new ArrayBuffer(44 + samples));
  const text = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8-bit, where silence is 128
  text(36, "data");
  view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([view.buffer], { type: "audio/wav" }));
}
