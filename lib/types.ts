export type ReviewStatus = "pass" | "fail" | "warning" | "pending" | "loading";

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

export interface AdFormatSpec {
  id: string;
  name: string;
  width: number;
  height: number;
  maxFileSize: number; // bytes
  allowedFormats: string[];
  guidelineUrl: string;
}

export const AD_FORMATS: Record<string, AdFormatSpec> = {
  fullPopup: {
    id: "fullPopup",
    name: "풀 팝업",
    width: 1080,
    height: 1566,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    allowedFormats: ["image/png"],
    guidelineUrl: "https://mathpresso.notion.site/9bb1c6139fd140ab87d3af8dd1114f7a",
  },
};
