import "server-only";
import { EndSensitivity, Modality, StartSensitivity, type LiveConnectConfig, type Tool } from "@google/genai";

/** The Gemini Live setup every call uses, app or phone: one voice, one way of listening. */
export function liveConfig({
  systemInstruction,
  voice,
  tools,
}: {
  systemInstruction: string;
  voice: string;
  tools: Tool[];
}): LiveConnectConfig {
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction,
    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    // Live re-bills the whole context every turn; compress early to keep long calls affordable.
    contextWindowCompression: { triggerTokens: "16000", slidingWindow: { targetTokens: "8000" } },
    realtimeInputConfig: {
      automaticActivityDetection: {
        startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
        // Answer as soon as the caller stops: eager end-of-speech, half a second of silence.
        endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
        prefixPaddingMs: 20,
        silenceDurationMs: 500,
      },
    },
    tools,
  };
}
