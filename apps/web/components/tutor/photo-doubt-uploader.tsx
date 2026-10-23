'use client';

import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import type { TutorImageAttachment } from '@edukriti/contracts';

interface PhotoDoubtUploaderProps {
  onImageSelected: (image: TutorImageAttachment | null) => void;
  selectedImage: TutorImageAttachment | null;
  disabled?: boolean;
}

export function PhotoDoubtUploader({
  onImageSelected,
  selectedImage,
  disabled = false,
}: PhotoDoubtUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setError('');

    // Allowed image types
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
    if (!allowedTypes.includes(file.type as (typeof allowedTypes)[number])) {
      setError('Please select a PNG, JPEG, or WebP image.');
      return;
    }

    // Size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onImageSelected({
        dataUrl,
        mimeType: file.type as TutorImageAttachment['mimeType'],
        caption: file.name,
      });
    };
    reader.onerror = () => {
      setError('Failed to load image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="text-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        aria-label="Upload photo of educational problem"
      />

      {selectedImage ? (
        <div className="relative inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-950/40 p-1.5 pr-3 text-sky-200">
          <div className="relative size-12 overflow-hidden rounded-lg border border-white/10 bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.dataUrl}
              alt={selectedImage.caption || 'Uploaded photo doubt'}
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="max-w-[120px] truncate font-medium text-white">
              {selectedImage.caption || 'Photo doubt'}
            </span>
            <span className="text-[10px] text-sky-300">Ready to extract</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="ml-1 rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Remove attached image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={disabled}
          title="Upload or drag & drop problem photo or diagram"
          className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 transition ${
            isDragging
              ? 'border-sky-400 bg-sky-500/20 text-sky-200 ring-2 ring-sky-400/40'
              : 'border-white/15 bg-white/5 text-slate-300 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200'
          } disabled:opacity-50`}
        >
          <Camera className="size-4 text-sky-400" />
          <span className="hidden sm:inline">{isDragging ? 'Drop Image' : 'Photo Doubt'}</span>
        </button>
      )}

      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
