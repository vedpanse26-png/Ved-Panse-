
import React, { useRef, useEffect, useState } from 'react';
import { ProctorService } from '../services/gemini';
import { CameraOff, Loader2 } from 'lucide-react';

interface LiveFeedProps {
  isActive: boolean;
  onIncidentDetected: (type: string, desc: string, severity: string) => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ isActive, onIncidentDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proctorServiceRef = useRef<ProctorService | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      startProctoring();
    } else {
      stopProctoring();
    }
    return () => stopProctoring();
  }, [isActive]);

  const startProctoring = async () => {
    setIsInitializing(true);
    setHasError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      proctorServiceRef.current = new ProctorService();
      await proctorServiceRef.current.connect({
        onIncident: (data) => {
          onIncidentDetected(data.type, data.description, data.severity);
        },
        onLog: (msg) => console.log('ProctorService:', msg)
      });

      // Setup audio streaming
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        proctorServiceRef.current?.sendAudio(inputData);
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      // Frame capturing loop (every 2 seconds for efficiency)
      const frameInterval = setInterval(() => {
        if (videoRef.current && canvasRef.current && proctorServiceRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            context.drawImage(videoRef.current, 0, 0, 640, 480);
            const base64Frame = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
            proctorServiceRef.current.sendFrame(base64Frame);
          }
        }
      }, 2000);

      (window as any)._proctorInterval = frameInterval;
      (window as any)._proctorAudio = { audioContext, source, scriptProcessor };

    } catch (err) {
      console.error(err);
      setHasError("Could not access camera/microphone. Please check permissions.");
    } finally {
      setIsInitializing(false);
    }
  };

  const stopProctoring = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (proctorServiceRef.current) {
      proctorServiceRef.current.disconnect();
      proctorServiceRef.current = null;
    }

    if ((window as any)._proctorInterval) {
      clearInterval((window as any)._proctorInterval);
    }

    if ((window as any)._proctorAudio) {
      const { audioContext, source, scriptProcessor } = (window as any)._proctorAudio;
      source.disconnect();
      scriptProcessor.disconnect();
      audioContext.close();
    }
  };

  return (
    <div className="w-full h-full relative rounded-lg bg-slate-900 border-4 border-slate-800 shadow-inner flex flex-col items-center justify-center">
      {!isActive && !isInitializing && (
        <div className="text-center text-slate-500">
          <CameraOff className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">Session Idle. Start proctoring to begin monitoring.</p>
        </div>
      )}

      {isInitializing && (
        <div className="text-center text-indigo-400">
          <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" />
          <p className="text-sm font-medium">Initializing Multi-modal Engine...</p>
        </div>
      )}

      {hasError && (
        <div className="text-center text-red-400 px-6">
          <p className="text-sm font-bold uppercase tracking-widest mb-2">Error</p>
          <p className="text-xs">{hasError}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover rounded-sm transition-opacity duration-700 ${isActive && !isInitializing ? 'opacity-100' : 'opacity-0'}`}
      />
      
      {isActive && !isInitializing && <div className="scanline" />}
      
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />

      {/* Overlays */}
      {isActive && !isInitializing && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20">
            LATENCY: 42ms
          </div>
          <div className="bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-2 py-1 rounded border border-white/20">
            RESOL: 640x480
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
