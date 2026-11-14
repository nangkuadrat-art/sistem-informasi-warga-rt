'use client';

import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  onCapture: (base64Image: string) => void;
}

export default function LiveCameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function startCamera() {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError('Izin kamera diperlukan untuk live selfie di pos ronda.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  function takeSnapshot() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        setCapturedImage(dataUrl);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  }

  function retake() {
    setCapturedImage(null);
    onCapture('');
    startCamera();
  }

  return (
    <div className="flex flex-col items-center">
      {cameraError && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-200 mb-3 w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="relative w-full max-w-sm aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Selfie Ronda"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-mono">
          Pos Ronda • {new Date().toLocaleTimeString('id-ID')}
        </div>
      </div>

      <div className="mt-3 flex gap-2 w-full max-w-sm">
        {capturedImage ? (
          <button
            type="button"
            onClick={retake}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Ambil Ulang Foto
          </button>
        ) : (
          <button
            type="button"
            onClick={takeSnapshot}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20"
          >
            <Camera className="w-4 h-4" />
            Ambil Foto Selfie
          </button>
        )}
      </div>
    </div>
  );
}
