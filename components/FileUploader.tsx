"use client";

import { useCallback, useState, useRef } from "react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
}

export default function FileUploader({ onFileSelect, previewUrl }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-200 min-h-[300px] flex flex-col items-center justify-center
          ${isDragging
            ? "border-orange-500 bg-orange-50"
            : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {previewUrl ? (
          <div className="w-full flex flex-col items-center gap-4">
            <img
              src={previewUrl}
              alt="업로드된 소재 프리뷰"
              className="max-h-[400px] rounded-lg shadow-md object-contain"
            />
            <p className="text-sm text-gray-500">
              다른 파일을 업로드하려면 클릭하거나 드래그하세요
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                광고 소재를 업로드하세요
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PNG 파일 / 1080x1566px / 1MB 이내
              </p>
            </div>
            <p className="text-xs text-gray-400">
              클릭하거나 파일을 드래그 앤 드롭하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
