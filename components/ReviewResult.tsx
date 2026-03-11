"use client";

import { ReviewItem, ReviewStatus } from "@/lib/types";

interface ReviewResultProps {
  title: string;
  items: ReviewItem[];
  loading?: boolean;
}

const statusConfig: Record<
  ReviewStatus,
  { icon: string; bg: string; text: string; border: string }
> = {
  pass: { icon: "V", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  fail: { icon: "X", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  warning: { icon: "!", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  pending: { icon: "-", bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
  loading: { icon: "...", bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200" },
};

function StatusBadge({ status }: { status: ReviewStatus }) {
  const config = statusConfig[status];
  const labels: Record<ReviewStatus, string> = {
    pass: "통과",
    fail: "미통과",
    warning: "주의",
    pending: "대기",
    loading: "분석중",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {labels[status]}
    </span>
  );
}

export default function ReviewResult({ title, items, loading }: ReviewResultProps) {
  const passCount = items.filter((i) => i.status === "pass").length;
  const failCount = items.filter((i) => i.status === "fail").length;
  const warnCount = items.filter((i) => i.status === "warning").length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {!loading && items.length > 0 && (
          <div className="flex gap-2 text-sm">
            {passCount > 0 && (
              <span className="text-green-600 font-medium">통과 {passCount}</span>
            )}
            {failCount > 0 && (
              <span className="text-red-600 font-medium">미통과 {failCount}</span>
            )}
            {warnCount > 0 && (
              <span className="text-yellow-600 font-medium">주의 {warnCount}</span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">AI 분석 중...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const config = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border ${config.border} ${config.bg}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-white/80 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="font-medium text-sm text-gray-800">
                        {item.label}
                      </span>
                    </div>
                    {item.detail && (
                      <p className={`text-sm mt-1 ${config.text}`}>{item.detail}</p>
                    )}
                    {item.guideline && (
                      <p className="text-xs text-gray-400 mt-1">
                        가이드: {item.guideline}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
