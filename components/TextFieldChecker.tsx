"use client";

import { useState, useCallback } from "react";
import { TextFieldSpec, ReviewItem } from "@/lib/types";

interface TextFieldCheckerProps {
  fields: TextFieldSpec[];
  onReviewComplete: (items: ReviewItem[]) => void;
  onTextChange?: (values: Record<string, string>) => void;
}

export default function TextFieldChecker({ fields, onReviewComplete, onTextChange }: TextFieldCheckerProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback(
    (fieldId: string, value: string) => {
      const newValues = { ...values, [fieldId]: value };
      const newTouched = { ...touched, [fieldId]: true };
      setValues(newValues);
      setTouched(newTouched);
      onTextChange?.(newValues);

      // 모든 필드가 입력되었는지 체크하고 자동으로 검수 결과 생성
      const items: ReviewItem[] = fields.map((field) => {
        const text = newValues[field.id] || "";
        const charCount = text.replace(/\n/g, "").length; // 줄바꿈 제외 순수 글자수
        const lineCount = text ? text.split("\n").length : 0;

        if (!newTouched[field.id] && !text) {
          return {
            id: `text_${field.id}`,
            category: "텍스트",
            label: `${field.label} 글자수`,
            status: "pending" as const,
            detail: `미입력 (최대 ${field.maxLength}자)`,
            guideline: `${field.label}: ${field.maxLines > 1 ? `${field.maxLines}줄, ` : ""}띄어쓰기 포함 최대 ${field.maxLength}자`,
          };
        }

        const isLengthOk = charCount <= field.maxLength;
        const isLineOk = lineCount <= field.maxLines;
        const isPass = isLengthOk && isLineOk && charCount > 0;

        let detail = "";
        if (charCount === 0) {
          detail = "텍스트를 입력해주세요";
        } else if (!isLengthOk) {
          detail = `${charCount}자 입력 → 최대 ${field.maxLength}자 초과 (${charCount - field.maxLength}자 초과)`;
        } else if (!isLineOk) {
          detail = `${lineCount}줄 입력 → 최대 ${field.maxLines}줄 초과`;
        } else {
          detail = `${charCount}/${field.maxLength}자 (${field.maxLength - charCount}자 여유)`;
        }

        return {
          id: `text_${field.id}`,
          category: "텍스트",
          label: `${field.label} 글자수`,
          status: isPass ? "pass" : charCount === 0 ? "warning" : "fail",
          detail,
          guideline: `${field.label}: ${field.maxLines > 1 ? `${field.maxLines}줄, ` : ""}띄어쓰기 포함 최대 ${field.maxLength}자`,
        };
      });

      onReviewComplete(items);
    },
    [values, touched, fields, onReviewComplete]
  );

  return (
    <div className="w-full space-y-4">
      <h3 className="text-sm font-medium text-gray-700">
        텍스트 소재 검수
      </h3>
      {fields.map((field) => {
        const value = values[field.id] || "";
        const charCount = value.replace(/\n/g, "").length; // 줄바꿈 제외
        const isOver = charCount > field.maxLength;
        const lineCount = value ? value.split("\n").length : 0;
        const isLineOver = lineCount > field.maxLines;

        return (
          <div key={field.id}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <span
                className={`text-xs font-mono ${
                  isOver ? "text-red-600 font-bold" : "text-gray-400"
                }`}
              >
                {charCount}/{field.maxLength}자
                {field.maxLines > 1 && (
                  <span className={isLineOver ? "text-red-600" : ""}>
                    {" "}· {lineCount}/{field.maxLines}줄
                  </span>
                )}
              </span>
            </div>
            {field.maxLines > 1 ? (
              <textarea
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={field.maxLines}
                className={`
                  w-full px-3 py-2 border rounded-lg text-sm transition-colors
                  focus:outline-none focus:ring-2 focus:ring-orange-300
                  ${isOver || isLineOver
                    ? "border-red-400 bg-red-50 focus:border-red-500"
                    : "border-gray-300 bg-white focus:border-orange-400"
                  }
                `}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className={`
                  w-full px-3 py-2 border rounded-lg text-sm transition-colors
                  focus:outline-none focus:ring-2 focus:ring-orange-300
                  ${isOver
                    ? "border-red-400 bg-red-50 focus:border-red-500"
                    : "border-gray-300 bg-white focus:border-orange-400"
                  }
                `}
              />
            )}
            {isOver && (
              <p className="text-xs text-red-500 mt-1">
                {charCount - field.maxLength}자 초과! 줄여주세요.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
