export type ReviewStatus = "pass" | "fail" | "warning" | "info" | "pending" | "loading";

export interface ReviewItem {
  id: string;
  category: string;
  label: string;
  status: ReviewStatus;
  detail?: string;
  guideline?: string;
}

export interface ClientReviewResult {
  items: ReviewItem[];
  backgroundColors: { hex: string; hsb: { h: number; s: number; b: number } }[];
}

export interface AIReviewResult {
  items: ReviewItem[];
  rawAnalysis?: string;
}

export type AdMediaType = "image" | "video" | "text";

export interface AdFormatSpec {
  id: string;
  name: string;
  mediaType: AdMediaType;
  width: number;
  height: number;
  aspectRatio?: string;
  maxFileSize: number; // bytes
  maxDuration?: number; // seconds (for video)
  allowedFormats: string[];
  acceptInput: string; // HTML input accept attribute
  guidelineUrl: string;
  description: string;
  extraFiles?: { name: string; width: number; height: number; format: string }[];
  textFields?: TextFieldSpec[];
}

export interface TextFieldSpec {
  id: string;
  label: string;
  maxLength: number;
  maxLines: number;
  placeholder?: string;
}

export const AD_FORMATS: Record<string, AdFormatSpec> = {
  fullPopup: {
    id: "fullPopup",
    name: "풀 팝업",
    mediaType: "image",
    width: 1080,
    height: 1566,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedFormats: ["image/png", "image/jpeg"],
    acceptInput: "image/png,image/jpeg",
    guidelineUrl: "https://mathpresso.notion.site/9bb1c6139fd140ab87d3af8dd1114f7a",
    description: "1080×1566px / PNG, JPG / 1MB 이내",
  },
  splash: {
    id: "splash",
    name: "스플래시",
    mediaType: "image",
    width: 1754,
    height: 585,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedFormats: ["image/png", "image/jpeg"],
    acceptInput: "image/png,image/jpeg",
    guidelineUrl: "https://mathpresso.notion.site/02e9ac142329482789da5b81e36c3b34",
    description: "1754×585px / PNG, JPG / 1MB 이내",
  },
  communityBanner: {
    id: "communityBanner",
    name: "커뮤니티 배너 (댓글 이벤트 전용)",
    mediaType: "image",
    width: 984,
    height: 720,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedFormats: ["image/png", "image/jpeg"],
    acceptInput: "image/png,image/jpeg",
    guidelineUrl: "https://mathpresso.notion.site/02e9ac142329482789da5b81e36c3b34",
    description: "메인 984×720px / 브랜드 24×24px / PNG, JPG / 1MB 이내",
    extraFiles: [{ name: "브랜드 이미지", width: 24, height: 24, format: "image/png,image/jpeg" }],
    textFields: [
      { id: "brandName", label: "브랜드명", maxLength: 20, maxLines: 1, placeholder: "띄어쓰기 포함 최대 20자" },
      { id: "headline", label: "헤드카피", maxLength: 20, maxLines: 1, placeholder: "띄어쓰기 포함 최대 20자" },
      { id: "leadCopy", label: "리드카피", maxLength: 40, maxLines: 2, placeholder: "띄어쓰기 포함 최대 40자 (2줄)" },
    ],
  },
  videoHorizontal: {
    id: "videoHorizontal",
    name: "가로 영상형",
    mediaType: "video",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxDuration: 60,
    allowedFormats: ["video/mp4"],
    acceptInput: "video/mp4",
    guidelineUrl: "https://mathpresso.notion.site/02e9ac142329482789da5b81e36c3b34",
    description: "16:9 비율 / MP4 / 100MB 이내 / 60초 이내",
    textFields: [
      { id: "headline", label: "헤드카피", maxLength: 8, maxLines: 1, placeholder: "띄어쓰기 포함 최대 8자" },
      { id: "leadCopy", label: "리드카피", maxLength: 20, maxLines: 1, placeholder: "띄어쓰기 포함 최대 20자" },
      { id: "cta", label: "CTA버튼", maxLength: 6, maxLines: 1, placeholder: "띄어쓰기 포함 최대 6자" },
    ],
  },
  videoVertical: {
    id: "videoVertical",
    name: "세로 영상형",
    mediaType: "video",
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxDuration: 60,
    allowedFormats: ["video/mp4"],
    acceptInput: "video/mp4",
    guidelineUrl: "https://mathpresso.notion.site/02e9ac142329482789da5b81e36c3b34",
    description: "9:16 비율 / MP4 / 100MB 이내 / 60초 이내",
    extraFiles: [{ name: "브랜드 이미지", width: 24, height: 24, format: "image/png,image/jpeg" }],
    textFields: [
      { id: "brandName", label: "브랜드명", maxLength: 8, maxLines: 1, placeholder: "띄어쓰기 포함 최대 8자" },
      { id: "cta", label: "CTA버튼", maxLength: 8, maxLines: 1, placeholder: "띄어쓰기 포함 최대 8자" },
    ],
  },
};

export const AD_FORMAT_LIST = Object.values(AD_FORMATS);
