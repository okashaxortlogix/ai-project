/**
 * Web Speech API wrapper for real-time speech-to-text dictation.
 */

let activeRecognition: any = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

export interface SpeechListenerOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
  lang?: string;
}

export function startSpeechRecognition(options: SpeechListenerOptions): boolean {
  if (!isSpeechRecognitionSupported()) return false;

  stopSpeechRecognition();

  try {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = options.lang || "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      options.onResult(text, Boolean(finalTranscript));
    };

    recognition.onerror = (err: any) => {
      if (options.onError) options.onError(err);
      activeRecognition = null;
    };

    recognition.onend = () => {
      if (options.onEnd) options.onEnd();
      activeRecognition = null;
    };

    recognition.start();
    activeRecognition = recognition;
    return true;
  } catch (e) {
    if (options.onError) options.onError(e);
    return false;
  }
}

export function stopSpeechRecognition(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      // Ignore
    }
    activeRecognition = null;
  }
}
