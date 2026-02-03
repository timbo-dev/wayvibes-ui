import { useCallback, useRef, useState } from "react";

export interface AudioSpectrumController {
  isEnabled: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  getFrequencyData: () => Uint8Array | null;
}

export function useAudioSpectrum(): AudioSpectrumController {
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (isEnabled) {
      return;
    }
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Captura de áudio não suportada neste ambiente.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);

      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsEnabled(true);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "Permissão negada. Ative o microfone/loopback para o app no sistema.",
        );
      } else if (name === "NotFoundError") {
        setError("Nenhum dispositivo de áudio encontrado.");
      } else if (name === "NotReadableError") {
        setError("Dispositivo de áudio ocupado ou indisponível.");
      } else {
        const message =
          err instanceof Error ? err.message : "Falha ao capturar áudio";
        setError(message);
      }
      setIsEnabled(false);
    }
  }, [isEnabled]);

  const stop = useCallback(() => {
    setIsEnabled(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataRef.current = null;
  }, []);

  const getFrequencyData = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;
    if (!analyser || !data) {
      return null;
    }
    analyser.getByteFrequencyData(data);
    return data;
  }, []);

  return { isEnabled, error, start, stop, getFrequencyData };
}
