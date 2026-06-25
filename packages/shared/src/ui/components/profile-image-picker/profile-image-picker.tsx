'use client';

import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { Button } from '../button';
import {
  canvasToJpegFile,
  compressImageFile,
  isAllowedImageType,
  readFileAsPreviewUrl,
  revokePreviewUrl,
} from './image-utils';

type PickerMode = 'idle' | 'preview' | 'camera';

export type ProfileImagePickerProps = {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  labels?: {
    section?: string;
    upload?: string;
    capture?: string;
    remove?: string;
    replace?: string;
    capturePhoto?: string;
    retake?: string;
    usePhoto?: string;
    cancel?: string;
    cameraUnavailable?: string;
    invalidType?: string;
  };
};

const DEFAULT_LABELS = {
  section: 'Profile picture',
  upload: 'Upload image',
  capture: 'Capture now',
  remove: 'Remove',
  replace: 'Replace',
  capturePhoto: 'Capture photo',
  retake: 'Retake',
  usePhoto: 'Use photo',
  cancel: 'Cancel',
  cameraUnavailable:
    'Camera is unavailable or permission was denied. You can upload an image instead.',
  invalidType: 'Please choose a JPG, PNG, or WebP image.',
};

export function ProfileImagePicker({
  value,
  onChange,
  disabled = false,
  labels: labelOverrides,
}: ProfileImagePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const inputId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<PickerMode>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pendingCaptureUrl, setPendingCaptureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      revokePreviewUrl(previewUrl);
      setPreviewUrl(null);
      setMode('idle');
      return;
    }

    const url = readFileAsPreviewUrl(value);
    revokePreviewUrl(previewUrl);
    setPreviewUrl(url);
    setMode('preview');
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      stopCamera();
      revokePreviewUrl(previewUrl);
      revokePreviewUrl(pendingCaptureUrl);
    };
  }, [pendingCaptureUrl, previewUrl]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!isAllowedImageType(file.type)) {
      setCameraError(labels.invalidType);
      return;
    }

    setCameraError(null);
    try {
      const compressed = await compressImageFile(file);
      onChange(compressed);
    } catch {
      setCameraError(labels.invalidType);
    }
  }

  async function startCamera() {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(labels.cameraUnavailable);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setMode('camera');
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError(labels.cameraUnavailable);
    }
  }

  function cancelCamera() {
    stopCamera();
    revokePreviewUrl(pendingCaptureUrl);
    setPendingCaptureUrl(null);
    setMode(value ? 'preview' : 'idle');
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    try {
      const file = await canvasToJpegFile(canvas);
      const compressed = await compressImageFile(file);
      revokePreviewUrl(pendingCaptureUrl);
      setPendingCaptureUrl(readFileAsPreviewUrl(compressed));
      setMode('preview');
      onChange(compressed);
    } catch {
      setCameraError(labels.cameraUnavailable);
      setMode('idle');
    }
  }

  function removeImage() {
    stopCamera();
    revokePreviewUrl(pendingCaptureUrl);
    setPendingCaptureUrl(null);
    onChange(null);
    setCameraError(null);
    setMode('idle');
  }

  return (
    <section className="space-y-4" aria-label={labels.section}>
      <h3 className="text-sm font-medium">{labels.section}</h3>

      {mode === 'preview' && previewUrl ? (
        <div className="space-y-3">
          <img
            src={previewUrl}
            alt="Profile preview"
            className="h-40 w-40 rounded-lg border object-cover"
            data-testid="profile-image-preview"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={disabled} asChild>
              <label htmlFor={inputId}>{labels.replace}</label>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void startCamera()}
              disabled={disabled}
            >
              <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
              {labels.capture}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeImage}
              disabled={disabled}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              {labels.remove}
            </Button>
          </div>
        </div>
      ) : mode === 'camera' ? (
        <div className="space-y-3">
          <video
            ref={videoRef}
            className="aspect-video w-full max-w-md rounded-lg border bg-black object-cover"
            playsInline
            muted
            data-testid="profile-camera-preview"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void capturePhoto()} disabled={disabled}>
              {labels.capturePhoto}
            </Button>
            <Button type="button" variant="outline" onClick={cancelCamera} disabled={disabled}>
              {labels.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={disabled} asChild>
            <label htmlFor={inputId}>
              <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
              {labels.upload}
            </label>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void startCamera()}
            disabled={disabled}
          >
            <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
            {labels.capture}
          </Button>
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleUploadChange(event)}
        disabled={disabled}
        data-testid="profile-image-file-input"
      />

      {cameraError ? (
        <p className="text-sm text-destructive" role="alert">
          {cameraError}
        </p>
      ) : null}
    </section>
  );
}
