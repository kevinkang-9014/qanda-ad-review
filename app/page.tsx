"use client";

import { useState, useCallback } from "react";
import FileUploader from "@/components/FileUploader";
import ReviewResult from "@/components/ReviewResult";
import { ReviewItem, AD_FORMATS } from "@/lib/types";
import { analyzeImageClient } from "@/lib/imageAnalysis";

export default function Home() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  const selectedFormat = AD_FORMATS.fullPopup;

  const handleFileSelect = useCallback(
    async (newFile: File) => {
      setReviewItems([]);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(newFile);
      setPreviewUrl(url);

      const result = await analyzeImageClient(newFile, selectedFormat);
      setReviewItems(result.items);
    },
    [previewUrl, selectedFormat]
  );

  const totalPass = reviewItems.filter((i) => i.status === "pass").length;
  const totalFail = reviewItems.filter((i) => i.status === "fail").length;
  const totalWarn = reviewItems.filter((i) => i.status === "warning").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                QANDA AD Review
              </h1>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            광고 지면 선택
          </label>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-orange-600 font-medium">
              {selectedFormat.name}
            </span>
            <span className="text-xs text-gray-500">
              {selectedFormat.width}x{selectedFormat.height}px / PNG / 1MB 이내
            </span>
          </div>
        </div>

        {/* Upload area */}
        <FileUploader onFileSelect={handleFileSelect} previewUrl={previewUrl} />

        {/* Results */}
        {reviewItems.length > 0 && (
          <div className="mt-8 space-y-6">
            {/* Summary banner */}
            <div
              className={`p-4 rounded-xl border ${
                totalFail > 0
                  ? "bg-red-50 border-red-200"
                  : totalWarn > 0
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-800">
                    {totalFail > 0
                      ? "수정이 필요합니다"
                      : totalWarn > 0
                      ? "검수 주의 항목이 있습니다"
                      : "검수 완료 - 모두 통과!"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    전체 {reviewItems.length}항목 중 통과 {totalPass} / 미통과{" "}
                    {totalFail} / 주의 {totalWarn}
                  </p>
                </div>
                {totalFail === 0 && totalWarn === 0 && (
                  <div className="text-4xl">&#10004;</div>
                )}
              </div>
            </div>

            {/* Review results */}
            <ReviewResult title="소재 검수 결과" items={reviewItems} />

            {/* Note about limitations */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>참고:</strong> 글자수(헤드카피/리드카피/CTA 문구), 이모지 사용 여부, 특수문자 중복 등 텍스트 내용 검수는 자동화 범위 밖입니다. 해당 항목은 제작가이드를 참고하여 직접 확인해 주세요.
              </p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center text-xs text-gray-400 pb-8">
          <p>
            콴다 광고 소재 검수 도구 | 문의:{" "}
            <a
              href="mailto:kevin.kang@mathpresso.com"
              className="text-orange-500 hover:underline"
            >
              kevin.kang@mathpresso.com
            </a>
          </p>
          <p className="mt-1">
            본 도구의 검수 결과는 참고용이며, 최종 심의는 내부 기준에 따릅니다.
          </p>
        </div>
      </main>
    </div>
  );
}
