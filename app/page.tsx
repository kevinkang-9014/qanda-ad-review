"use client";

import { useState, useCallback, useRef } from "react";
import FileUploader from "@/components/FileUploader";
import TextFieldChecker from "@/components/TextFieldChecker";
import ReviewResult from "@/components/ReviewResult";
import PhoneMockup from "@/components/PhoneMockup";
import { ReviewItem, AdFormatSpec, AD_FORMAT_LIST } from "@/lib/types";
import { analyzeImageClient, analyzeVideoClient } from "@/lib/imageAnalysis";

export default function Home() {
  const [selectedFormat, setSelectedFormat] = useState<AdFormatSpec>(AD_FORMAT_LIST[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileReviewItems, setFileReviewItems] = useState<ReviewItem[]>([]);
  const [textReviewItems, setTextReviewItems] = useState<ReviewItem[]>([]);
  const [logoReviewItems, setLogoReviewItems] = useState<ReviewItem[]>([]);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const allReviewItems = [...fileReviewItems, ...textReviewItems, ...logoReviewItems];
  const hasAnyResult = allReviewItems.filter((i) => i.status !== "pending").length > 0;

  const handleFormatChange = useCallback((format: AdFormatSpec) => {
    setSelectedFormat(format);
    setPreviewUrl(null);
    setFileReviewItems([]);
    setTextReviewItems([]);
    setLogoReviewItems([]);
    setLogoPreviewUrl(null);
    setTextValues({});
  }, []);

  const handleFileSelect = useCallback(
    async (newFile: File) => {
      setFileReviewItems([]);
      setIsAnalyzing(true);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(newFile);
      setPreviewUrl(url);

      let result;
      if (selectedFormat.mediaType === "video") {
        result = await analyzeVideoClient(newFile, selectedFormat);
      } else {
        result = await analyzeImageClient(newFile, selectedFormat);
      }
      setFileReviewItems(result.items);
      setIsAnalyzing(false);
    },
    [previewUrl, selectedFormat]
  );

  const handleTextReview = useCallback((items: ReviewItem[]) => {
    setTextReviewItems(items);
  }, []);

  const handleLogoSelect = useCallback(
    async (file: File) => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      const url = URL.createObjectURL(file);
      setLogoPreviewUrl(url);

      const items: ReviewItem[] = [];
      const extraSpec = selectedFormat.extraFiles?.[0];
      if (!extraSpec) return;

      // 파일 포맷 체크
      const allowedLogoFormats = extraSpec.format.split(",");
      const isValidFormat = allowedLogoFormats.includes(file.type);
      const formatLabel = allowedLogoFormats.map(f => f.split("/")[1]?.toUpperCase()).join(", ");
      items.push({
        id: "logo-format",
        category: "로고 이미지",
        label: "파일 형식",
        status: isValidFormat ? "pass" : "fail",
        detail: isValidFormat ? `${file.type.split("/")[1]?.toUpperCase()} 형식` : `${file.type || "알 수 없음"} → ${formatLabel}만 가능`,
      });

      // 1:1 비율 체크
      const img = new Image();
      img.src = url;
      await new Promise((resolve) => { img.onload = resolve; });
      const isSquare = img.naturalWidth === img.naturalHeight;
      items.push({
        id: "logo-ratio",
        category: "로고 이미지",
        label: "1:1 비율",
        status: isSquare ? "pass" : "fail",
        detail: isSquare
          ? `${img.naturalWidth}×${img.naturalHeight}px (정사각형)`
          : `${img.naturalWidth}×${img.naturalHeight}px → 1:1 비율이어야 합니다`,
      });

      // 파일 크기
      const isUnder1MB = file.size <= 1 * 1024 * 1024;
      items.push({
        id: "logo-size",
        category: "로고 이미지",
        label: "파일 용량",
        status: isUnder1MB ? "pass" : "fail",
        detail: `${(file.size / 1024).toFixed(1)}KB${isUnder1MB ? "" : " → 1MB 이내"}`,
      });

      setLogoReviewItems(items);
    },
    [logoPreviewUrl, selectedFormat]
  );

  // 결과 집계 (pending 제외)
  const activeItems = allReviewItems.filter((i) => i.status !== "pending");
  const totalPass = activeItems.filter((i) => i.status === "pass").length;
  const totalFail = activeItems.filter((i) => i.status === "fail").length;
  const totalWarn = activeItems.filter((i) => i.status === "warning").length;
  const totalInfo = activeItems.filter((i) => i.status === "info").length;
  const isOverallPass = totalFail === 0; // fail 없으면 통과 (warning, info는 통과)

  const hasTextFields = selectedFormat.textFields && selectedFormat.textFields.length > 0;
  const hasExtraFiles = selectedFormat.extraFiles && selectedFormat.extraFiles.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/qanda-symbol.png" alt="QANDA" width={36} height={36} className="rounded-lg" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">QANDA AD Review</h1>
              <p className="text-xs text-gray-500">광고 소재 자동 검수</p>
            </div>
          </div>
          <a
            href="https://mathpresso.notion.site/02e9ac142329482789da5b81e36c3b34"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
          >
            제작가이드 보기
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Format selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            광고 지면 선택
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AD_FORMAT_LIST.map((format) => {
              const isSelected = selectedFormat.id === format.id;
              const isVideo = format.mediaType === "video";
              return (
                <button
                  key={format.id}
                  onClick={() => handleFormatChange(format)}
                  className={`
                    p-3 rounded-xl border-2 text-left transition-all duration-200
                    ${isSelected
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      isVideo
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {isVideo ? "동영상" : "이미지"}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-orange-600 font-medium">선택됨</span>
                    )}
                  </div>
                  <p className={`font-semibold text-sm ${isSelected ? "text-orange-700" : "text-gray-800"}`}>
                    {format.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload + Mockup Preview */}
        <div className={`grid grid-cols-1 ${previewUrl && (selectedFormat.mediaType === "image" || selectedFormat.id === "videoHorizontal" || selectedFormat.id === "videoVertical") ? "lg:grid-cols-2" : ""} gap-6`}>
          {/* Upload area + Text fields */}
          <div className="space-y-6">
            <FileUploader
              onFileSelect={handleFileSelect}
              previewUrl={previewUrl}
              spec={selectedFormat}
            />

            {/* Logo image upload for extraFiles */}
            {hasExtraFiles && selectedFormat.extraFiles && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  로고 이미지 검수
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {selectedFormat.extraFiles[0].width}×{selectedFormat.extraFiles[0].height}px / 1:1 비율 / PNG
                </p>
                <LogoUploader
                  onFileSelect={handleLogoSelect}
                  previewUrl={logoPreviewUrl}
                />
              </div>
            )}

            {/* Text field checker */}
            {hasTextFields && selectedFormat.textFields && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <TextFieldChecker
                  fields={selectedFormat.textFields}
                  onReviewComplete={handleTextReview}
                  onTextChange={setTextValues}
                />
              </div>
            )}
          </div>

          {/* Phone Mockup Preview */}
          {previewUrl && (selectedFormat.mediaType === "image" || selectedFormat.id === "videoHorizontal" || selectedFormat.id === "videoVertical") && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">📱 콴다 앱 게재 미리보기</h3>
              <PhoneMockup imageUrl={previewUrl} formatId={selectedFormat.id} textValues={textValues} logoUrl={logoPreviewUrl} />
            </div>
          )}
        </div>

        {/* Analyzing indicator */}
        {isAnalyzing && (
          <div className="mt-6 flex items-center justify-center py-8 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">소재 검수 중...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!isAnalyzing && hasAnyResult && (
          <div className="mt-8 space-y-6">
            {/* Summary banner */}
            <div
              className={`p-4 rounded-xl border ${
                totalFail > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800">
                    {isOverallPass
                      ? "검수 통과!"
                      : "수정이 필요합니다"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    전체 {activeItems.length}항목 중 통과 {totalPass} / 미통과{" "}
                    {totalFail}
                    {totalWarn > 0 ? ` / 주의 ${totalWarn}` : ""}
                    {totalInfo > 0 ? ` / 확인 ${totalInfo}` : ""}
                  </p>
                </div>
                {isOverallPass && (
                  <div className="text-4xl">&#10004;</div>
                )}
              </div>
            </div>

            {/* File review results */}
            {fileReviewItems.length > 0 && (
              <ReviewResult title={`${selectedFormat.name} 파일 검수`} items={fileReviewItems} />
            )}

            {/* Logo review results */}
            {logoReviewItems.length > 0 && (
              <ReviewResult title="로고 이미지 검수" items={logoReviewItems} />
            )}

            {/* Text review results */}
            {textReviewItems.filter((i) => i.status !== "pending").length > 0 && (
              <ReviewResult title="텍스트 검수" items={textReviewItems.filter((i) => i.status !== "pending")} />
            )}

            {/* Note */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">
                이모지, 특수문자, 글자수 관련 세부 협의는 담당자에게 연락부탁드리겠습니다.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400 pb-8">
          <p>
            콴다 광고 소재 검수 도구 | 문의:{" "}
            <a href="mailto:kevin.kang@mathpresso.com" className="text-orange-500 hover:underline">
              kevin.kang@mathpresso.com
            </a>
            {" / "}
            <a href="mailto:ads@mathpresso.com" className="text-orange-500 hover:underline">
              ads@mathpresso.com
            </a>
          </p>
          <p className="mt-2 text-orange-600 font-semibold">
            ※ 본 도구의 검수 결과는 참고용이며, 최종 심의는 내부 기준에 따릅니다.
          </p>
        </div>
      </main>
    </div>
  );
}

function LogoUploader({
  onFileSelect,
  previewUrl,
}: {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
        isDragOver
          ? "border-orange-500 bg-orange-50 scale-[1.02]"
          : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
      {previewUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={previewUrl}
            alt="로고 프리뷰"
            className="w-12 h-12 rounded-lg border border-gray-200 object-contain bg-white"
          />
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700">로고 이미지 업로드 완료</p>
            <p className="text-xs text-gray-500">다른 파일을 업로드하려면 클릭하거나 드래그하세요</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">클릭하거나 파일을 드래그 앤 드롭하세요</p>
          <p className="text-xs text-gray-400">PNG, JPG / 1:1 비율</p>
        </div>
      )}
    </div>
  );
}
