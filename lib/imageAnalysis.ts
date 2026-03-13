import { ReviewItem, ClientReviewResult, AdFormatSpec } from "./types";

// === PSD 기반 영역 좌표 (스플래시 1754x585) ===
const SPLASH_REGIONS = {
  homeBar: { left: 452, top: 545, right: 1302, bottom: 585 }, // 아이폰 Home Bar 영역 (하단 40px)
  safeArea: { left: 452, top: 0, right: 1302, bottom: 585 }, // 안전 영역 (850px 너비)
  extendedArea: { left: 0, top: 0, right: 1754, bottom: 585 }, // 확장형 영역 (전체)
};

// === PSD 기반 영역 좌표 (풀 팝업 1080x1566) ===
const FULL_POPUP_REGIONS = {
  logo: { left: 231, top: 53, right: 849, bottom: 173 },
  headline: { left: 217, top: 225, right: 863, bottom: 454 },
  leadCopy: { left: 139, top: 504, right: 941, bottom: 549 },
  textArea: { left: 102, top: 222, right: 983, bottom: 551 },
  cta: { left: 232, top: 1316, right: 846, bottom: 1466 },
  mainImage: { left: 101, top: 605, right: 984, bottom: 1567 },
  bottomNotice: { left: 352, top: 1495, right: 728, bottom: 1535 },
};

type Region = { left: number; top: number; right: number; bottom: number };

function rgbToHsb(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const bri = Math.round(max * 100);
  return { h, s, b: bri };
}

function sampleBackgroundColors(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { hex: string; hsb: { h: number; s: number; b: number } }[] {
  const points = [
    [5, 5], [width - 6, 5], [5, height - 6], [width - 6, height - 6],
    [Math.floor(width / 2), 5], [5, Math.floor(height / 2)],
    [width - 6, Math.floor(height / 2)], [Math.floor(width / 2), height - 6],
    [20, 20], [width - 21, 20], [20, height - 21], [width - 21, height - 21],
  ];

  const seen = new Set<string>();
  const colors: { hex: string; hsb: { h: number; s: number; b: number } }[] = [];

  for (const [x, y] of points) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`.toUpperCase();
    if (!seen.has(hex)) {
      seen.add(hex);
      colors.push({ hex, hsb: rgbToHsb(pixel[0], pixel[1], pixel[2]) });
    }
  }
  return colors;
}

// === 영역 기반 분석 유틸 ===

function hasContentInRegion(
  ctx: CanvasRenderingContext2D,
  region: Region,
  bgColors: Set<string>,
  threshold = 0.03
): { hasContent: boolean; contentRatio: number } {
  const w = region.right - region.left;
  const h = region.bottom - region.top;
  const imageData = ctx.getImageData(region.left, region.top, w, h);
  const data = imageData.data;
  const totalPixels = w * h;

  let contentPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const hex = `#${data[i].toString(16).padStart(2, "0")}${data[i + 1].toString(16).padStart(2, "0")}${data[i + 2].toString(16).padStart(2, "0")}`.toUpperCase();
    if (!bgColors.has(hex) && data[i + 3] > 128) {
      contentPixels++;
    }
  }

  const contentRatio = contentPixels / totalPixels;
  return { hasContent: contentRatio > threshold, contentRatio };
}

function countTextColors(
  ctx: CanvasRenderingContext2D,
  region: Region,
  bgColors: Set<string>,
  minPixelRatio = 0.005
): { colors: string[]; count: number } {
  const w = region.right - region.left;
  const h = region.bottom - region.top;
  const imageData = ctx.getImageData(region.left, region.top, w, h);
  const data = imageData.data;
  const totalPixels = w * h;

  const colorMap = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const hex = `#${data[i].toString(16).padStart(2, "0")}${data[i + 1].toString(16).padStart(2, "0")}${data[i + 2].toString(16).padStart(2, "0")}`.toUpperCase();
    if (bgColors.has(hex)) continue;

    let matched = false;
    for (const [existing] of colorMap) {
      const er = parseInt(existing.slice(1, 3), 16);
      const eg = parseInt(existing.slice(3, 5), 16);
      const eb = parseInt(existing.slice(5, 7), 16);
      if (Math.abs(data[i] - er) <= 10 && Math.abs(data[i + 1] - eg) <= 10 && Math.abs(data[i + 2] - eb) <= 10) {
        colorMap.set(existing, (colorMap.get(existing) || 0) + 1);
        matched = true;
        break;
      }
    }
    if (!matched) {
      colorMap.set(hex, 1);
    }
  }

  const significantColors = Array.from(colorMap.entries())
    .filter(([, count]) => count / totalPixels > minPixelRatio)
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  return { colors: significantColors, count: significantColors.length };
}

function checkCtaTextColor(
  ctx: CanvasRenderingContext2D,
  region: Region,
  bgColors: Set<string>
): { pass: boolean; dominantTextColor: string; detail: string } {
  const textColorResult = countTextColors(ctx, region, bgColors, 0.01);

  if (textColorResult.colors.length === 0) {
    return { pass: true, dominantTextColor: "N/A", detail: "CTA 텍스트 색상 감지 불가" };
  }

  const dominantColor = textColorResult.colors[0];
  const r = parseInt(dominantColor.slice(1, 3), 16);
  const g = parseInt(dominantColor.slice(3, 5), 16);
  const b = parseInt(dominantColor.slice(5, 7), 16);

  const isNearBlack = r <= 30 && g <= 30 && b <= 30;
  const isNearWhite = r >= 225 && g >= 225 && b >= 225;
  const pass = isNearBlack || isNearWhite;

  return {
    pass,
    dominantTextColor: dominantColor,
    detail: pass
      ? `CTA 텍스트 색상: ${dominantColor} (${isNearBlack ? "흑색" : "백색"} 계열)`
      : `CTA 텍스트 색상: ${dominantColor} → 흑(#000) 또는 백(#FFF)만 허용`,
  };
}

/**
 * 특정 영역에 텍스트가 있는지 판별.
 * 엣지 밀도 + 색상 다양성을 조합하여 텍스트와 이미지를 구분.
 * - 텍스트: 소수의 색상(텍스트색 + 배경색) + 높은 엣지 밀도
 * - 이미지: 다양한 색상(그라데이션, 사진) + 높은 엣지 밀도 → 텍스트 아님
 *
 * colorBucketThreshold: 양자화된 색상 수가 이 값 미만이면 텍스트 가능성 있음 (기본 20)
 * edgeThreshold: 엣지 비율 기준 (기본 0.08 = 8%)
 */
function hasTextInRegion(
  ctx: CanvasRenderingContext2D,
  region: Region,
  edgeThreshold = 0.08,
  colorBucketThreshold = 20
): { hasText: boolean; edgeRatio: number; colorCount: number } {
  const w = region.right - region.left;
  const h = region.bottom - region.top;
  if (w <= 2 || h <= 2) return { hasText: false, edgeRatio: 0, colorCount: 0 };

  const imageData = ctx.getImageData(region.left, region.top, w, h);
  const data = imageData.data;

  // 1. 엣지 밀도 계산 (Sobel-like gradient)
  let edgePixels = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const left = ((y * w) + (x - 1)) * 4;
      const right = ((y * w) + (x + 1)) * 4;
      const top = (((y - 1) * w) + x) * 4;
      const bottom = (((y + 1) * w) + x) * 4;

      const gx = Math.abs(data[right] - data[left]) + Math.abs(data[right + 1] - data[left + 1]) + Math.abs(data[right + 2] - data[left + 2]);
      const gy = Math.abs(data[bottom] - data[top]) + Math.abs(data[bottom + 1] - data[top + 1]) + Math.abs(data[bottom + 2] - data[top + 2]);

      if (gx + gy > 100) edgePixels++;
    }
  }

  const edgeRatio = edgePixels / (w * h);

  // 2. 색상 다양성 분석 (32단계 양자화)
  // 텍스트: 텍스트색 + 배경색 + 안티앨리어싱 → ~5-15개 버킷
  // 이미지(포스터, 사진): 그라데이션, 다양한 색상 → 30개+ 버킷
  const colorBuckets = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    const qr = data[i] >> 5;       // 0~7 (32단계 양자화)
    const qg = data[i + 1] >> 5;
    const qb = data[i + 2] >> 5;
    colorBuckets.add(`${qr},${qg},${qb}`);
  }

  const colorCount = colorBuckets.size;

  // 텍스트 판정: 엣지 밀도가 높고 AND 색상 수가 적을 때만
  // 색상이 다양하면 이미지 콘텐츠로 판정 → 텍스트 아님
  const isLikelyText = edgeRatio > edgeThreshold && colorCount < colorBucketThreshold;

  return { hasText: isLikelyText, edgeRatio, colorCount };
}

function estimateTextRatio(
  ctx: CanvasRenderingContext2D,
  fullWidth: number,
  fullHeight: number,
  textRegion: Region,
): { ratio: number; pass: boolean } {
  const textAreaSize = (textRegion.right - textRegion.left) * (textRegion.bottom - textRegion.top);
  const totalArea = fullWidth * fullHeight;

  const w = textRegion.right - textRegion.left;
  const h = textRegion.bottom - textRegion.top;
  const imageData = ctx.getImageData(textRegion.left, textRegion.top, w, h);
  const data = imageData.data;

  let edgePixels = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const left = ((y * w) + (x - 1)) * 4;
      const right = ((y * w) + (x + 1)) * 4;
      const top = (((y - 1) * w) + x) * 4;
      const bottom = (((y + 1) * w) + x) * 4;

      const gx = Math.abs(data[right] - data[left]) + Math.abs(data[right + 1] - data[left + 1]) + Math.abs(data[right + 2] - data[left + 2]);
      const gy = Math.abs(data[bottom] - data[top]) + Math.abs(data[bottom + 1] - data[top + 1]) + Math.abs(data[bottom + 2] - data[top + 2]);

      if (gx + gy > 100) edgePixels++;
    }
  }

  const textContentRatio = edgePixels / (w * h);
  const estimatedTextAreaInFull = (textAreaSize * textContentRatio) / totalArea;
  const ratio = Math.round(estimatedTextAreaInFull * 100);

  return { ratio, pass: ratio < 30 };
}

// === 공통 기본 검수 (이미지) ===

function runBasicImageChecks(file: File, spec: AdFormatSpec): ReviewItem[] {
  const items: ReviewItem[] = [];

  // 파일 형식
  const isValidFormat = spec.allowedFormats.includes(file.type);
  const formatLabel = spec.allowedFormats.map(f => f.split("/")[1].toUpperCase()).join(", ");
  items.push({
    id: "format",
    category: "기본",
    label: "파일 형식",
    status: isValidFormat ? "pass" : "fail",
    detail: isValidFormat ? `${formatLabel} 형식 확인` : `${file.type || "알 수 없는 형식"} → ${formatLabel}만 허용`,
    guideline: `파일형식: ${formatLabel}`,
  });

  // 파일 용량
  const maxSizeMB = spec.maxFileSize / (1024 * 1024);
  const isValidSize = file.size <= spec.maxFileSize;
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  items.push({
    id: "fileSize",
    category: "기본",
    label: "파일 용량",
    status: isValidSize ? "pass" : "fail",
    detail: isValidSize ? `${sizeMB}MB (${maxSizeMB}MB 이내)` : `${sizeMB}MB → ${maxSizeMB}MB 이내여야 합니다`,
    guideline: `파일용량: ${maxSizeMB}MB 이내`,
  });

  return items;
}

// === 공통 배경색 검수 ===

function runBackgroundChecks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { items: ReviewItem[]; bgColors: { hex: string; hsb: { h: number; s: number; b: number } }[]; bgColorSet: Set<string> } {
  const items: ReviewItem[] = [];
  const bgColors = sampleBackgroundColors(ctx, width, height);
  const bgColorSet = new Set(bgColors.map((c) => c.hex));

  // 흰색 배경 금지
  const hasWhiteBg = bgColors.some((c) => c.hex === "#FFFFFF");
  items.push({
    id: "bgWhite",
    category: "배경",
    label: "흰색 배경 금지",
    status: hasWhiteBg ? "fail" : "pass",
    detail: hasWhiteBg ? "배경에 #FFFFFF(흰색) 감지됨 → 흰색 배경 사용 금지" : "흰색 배경 미감지",
    guideline: "배경 컬러: 하얀 배경 컬러(#FFFFFF) 사용 금지",
  });


  return { items, bgColors, bgColorSet };
}

// === 풀 팝업 전용 영역 검수 ===

function runFullPopupRegionChecks(
  ctx: CanvasRenderingContext2D,
  bgColorSet: Set<string>,
  canvasWidth: number,
  canvasHeight: number
): ReviewItem[] {
  const items: ReviewItem[] = [];
  const R = FULL_POPUP_REGIONS;

  // 로고 영역
  const logoCheck = hasContentInRegion(ctx, R.logo, bgColorSet, 0.02);
  items.push({
    id: "logoPresence",
    category: "로고",
    label: "로고 존재 여부",
    status: logoCheck.hasContent ? "pass" : "warning",
    detail: logoCheck.hasContent
      ? `로고 영역에 콘텐츠 감지 (${(logoCheck.contentRatio * 100).toFixed(1)}%)`
      : "로고 영역에 콘텐츠가 감지되지 않음 — 로고를 확인하세요",
    guideline: "상단 지정 영역에 로고 배치 필요",
  });

  // 헤드카피 영역
  const headlineCheck = hasContentInRegion(ctx, R.headline, bgColorSet, 0.01);
  items.push({
    id: "headlinePresence",
    category: "텍스트",
    label: "헤드카피 영역",
    status: headlineCheck.hasContent ? "pass" : "warning",
    detail: headlineCheck.hasContent
      ? `헤드카피 영역에 콘텐츠 감지 (${(headlineCheck.contentRatio * 100).toFixed(1)}%)`
      : "헤드카피 영역에 콘텐츠가 없습니다",
    guideline: "헤드카피: 최대 2줄, 16자 이내 (띄어쓰기 포함)",
  });

  // 리드카피 영역
  const leadCheck = hasContentInRegion(ctx, R.leadCopy, bgColorSet, 0.01);
  items.push({
    id: "leadCopyPresence",
    category: "텍스트",
    label: "리드카피 영역",
    status: leadCheck.hasContent ? "pass" : "warning",
    detail: leadCheck.hasContent
      ? `리드카피 영역에 콘텐츠 감지 (${(leadCheck.contentRatio * 100).toFixed(1)}%)`
      : "리드카피 영역에 콘텐츠가 없습니다 — 리드카피 확인 필요",
    guideline: "리드카피: 최대 1줄, 18자 이내",
  });


  // CTA 버튼
  const ctaCheck = hasContentInRegion(ctx, R.cta, bgColorSet, 0.05);
  items.push({
    id: "ctaPresence",
    category: "CTA",
    label: "CTA 버튼 존재",
    status: ctaCheck.hasContent ? "pass" : "warning",
    detail: ctaCheck.hasContent
      ? `CTA 영역에 콘텐츠 감지 (${(ctaCheck.contentRatio * 100).toFixed(1)}%)`
      : "CTA 버튼 영역에 콘텐츠가 없습니다",
    guideline: "CTA 버튼: ~기 형식, 최대 8자",
  });


  // 하단고지 영역
  const bottomCheck = hasContentInRegion(ctx, R.bottomNotice, bgColorSet, 0.01);
  items.push({
    id: "bottomNotice",
    category: "하단고지",
    label: "하단고지 영역",
    status: bottomCheck.hasContent ? "pass" : "info",
    detail: bottomCheck.hasContent
      ? `하단고지 영역에 콘텐츠 감지 (${(bottomCheck.contentRatio * 100).toFixed(1)}%)`
      : "하단고지 영역에 콘텐츠가 없습니다 — 업종에 따라 심의필이 필요할 수 있습니다",
    guideline: "병의원, 건기식 등 심의필이 필수인 업종은 넣어주시길 권장드립니다. 심의필 미기재로 인한 불이익은 매체에서 책임지지 않습니다.",
  });

  // 텍스트 비율
  const textRatioResult = estimateTextRatio(ctx, canvasWidth, canvasHeight, R.textArea);
  items.push({
    id: "textRatio",
    category: "레이아웃",
    label: "텍스트 비율 (30% 미만)",
    status: textRatioResult.pass ? "pass" : "warning",
    detail: `이미지 내 텍스트 영역 비율: 약 ${textRatioResult.ratio}%${textRatioResult.pass ? "" : " → 30% 미만 권장"}`,
    guideline: "이미지 내 텍스트가 전체의 30%를 넘지 않아야 합니다",
  });

  // 로고 위 영역
  const aboveLogoRegion = { left: 0, top: 0, right: canvasWidth, bottom: FULL_POPUP_REGIONS.logo.top };
  const aboveLogoCheck = hasContentInRegion(ctx, aboveLogoRegion, bgColorSet, 0.02);
  if (aboveLogoCheck.hasContent && aboveLogoCheck.contentRatio > 0.05) {
    items.push({
      id: "logoAreaClean",
      category: "로고",
      label: "로고 영역 외 상단 콘텐츠",
      status: "warning",
      detail: `로고 위 영역에 콘텐츠 감지 (${(aboveLogoCheck.contentRatio * 100).toFixed(1)}%) — 시스템 영역과 겹칠 수 있습니다`,
      guideline: "상단 시스템 영역에는 콘텐츠를 배치하지 마세요",
    });
  }

  return items;
}

// === 이미지 분석 (풀 팝업, 스플래시, 커뮤니티 배너) ===

export function analyzeImageClient(
  file: File,
  spec: AdFormatSpec
): Promise<ClientReviewResult> {
  return new Promise((resolve) => {
    const items: ReviewItem[] = [];

    // 기본 검수
    items.push(...runBasicImageChecks(file, spec));

    // Canvas 기반 분석
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // 이미지 크기
      const isValidDimension = img.naturalWidth === spec.width && img.naturalHeight === spec.height;
      items.push({
        id: "dimensions",
        category: "기본",
        label: "이미지 크기",
        status: isValidDimension ? "pass" : "fail",
        detail: isValidDimension
          ? `${spec.width}x${spec.height}px 확인`
          : `${img.naturalWidth}x${img.naturalHeight}px → ${spec.width}x${spec.height}px 필요`,
        guideline: `사이즈: ${spec.width}x${spec.height}px / 72dpi`,
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // 배경색 검수
      const bgResult = runBackgroundChecks(ctx, canvas.width, canvas.height);
      items.push(...bgResult.items);

      // 포맷별 상세 검수
      if (spec.id === "fullPopup" && isValidDimension) {
        items.push(...runFullPopupRegionChecks(ctx, bgResult.bgColorSet, canvas.width, canvas.height));
      }

      // 스플래시 추가 검수
      if (spec.id === "splash" && isValidDimension) {
        // 아이폰 Home Bar 영역 검수 (하단 40px, x: 452~1302)
        // 이미지는 OK, 텍스트가 있을 때만 미통과
        const homeBarContent = hasContentInRegion(ctx, SPLASH_REGIONS.homeBar, bgResult.bgColorSet, 0.03);
        const homeBarText = hasTextInRegion(ctx, SPLASH_REGIONS.homeBar, 0.08, 20);
        const homeBarHasText = homeBarContent.hasContent && homeBarText.hasText;
        items.push({
          id: "iphoneHomeBar",
          category: "레이아웃",
          label: "아이폰 Home Bar 영역 (텍스트)",
          status: homeBarHasText ? "fail" : "pass",
          detail: homeBarHasText
            ? `Home Bar 영역에 텍스트 감지 (엣지 ${(homeBarText.edgeRatio * 100).toFixed(1)}%, 색상 ${homeBarText.colorCount}개) → 아이폰 홈 인디케이터와 겹쳐 검수 미통과`
            : homeBarContent.hasContent
              ? `Home Bar 영역: 이미지 콘텐츠 (엣지 ${(homeBarText.edgeRatio * 100).toFixed(1)}%, 색상 ${homeBarText.colorCount}개) — 텍스트 아님, 검수 통과`
              : "Home Bar 영역에 콘텐츠 없음 — 검수 통과",
          guideline: "하단 40px (y: 545~585, x: 452~1302)은 아이폰 Home Bar 영역입니다. 이미지는 허용되지만, 텍스트 배치 시 미통과 처리됩니다.",
        });

        // 안전 영역 외 콘텐츠 확인
        const leftMargin = { left: 0, top: 0, right: SPLASH_REGIONS.safeArea.left, bottom: canvas.height };
        const rightMargin = { left: SPLASH_REGIONS.safeArea.right, top: 0, right: canvas.width, bottom: canvas.height };
        const leftCheck = hasContentInRegion(ctx, leftMargin, bgResult.bgColorSet, 0.02);
        const rightCheck = hasContentInRegion(ctx, rightMargin, bgResult.bgColorSet, 0.02);
        if (leftCheck.hasContent || rightCheck.hasContent) {
          items.push({
            id: "safeAreaOverflow",
            category: "레이아웃",
            label: "안전 영역 외 콘텐츠",
            status: "info",
            detail: "확장형 영역(안전 영역 밖)에 콘텐츠가 감지되었습니다. 일부 기기에서 잘릴 수 있습니다.",
            guideline: "안전 영역(x: 452~1302)에 핵심 콘텐츠를 배치하세요. 확장형 영역은 배경/패턴 용도로만 사용하세요.",
          });
        }

        // 텍스트 비율 추정 (전체 이미지 기반)
        const textRegion = { left: 0, top: 0, right: canvas.width, bottom: canvas.height };
        const textRatioResult = estimateTextRatio(ctx, canvas.width, canvas.height, textRegion);
        items.push({
          id: "textRatio",
          category: "레이아웃",
          label: "텍스트 비율 (30% 미만)",
          status: textRatioResult.pass ? "pass" : "warning",
          detail: `이미지 내 텍스트 영역 비율: 약 ${textRatioResult.ratio}%${textRatioResult.pass ? "" : " → 30% 미만 권장"}`,
          guideline: "이미지 내 텍스트가 전체의 30%를 넘지 않아야 합니다",
        });
      }

      URL.revokeObjectURL(url);
      resolve({ items, backgroundColors: bgResult.bgColors });
    };

    img.onerror = () => {
      items.push({
        id: "dimensions",
        category: "기본",
        label: "이미지 로드",
        status: "fail",
        detail: "이미지를 로드할 수 없습니다",
      });
      URL.revokeObjectURL(url);
      resolve({ items, backgroundColors: [] });
    };

    img.src = url;
  });
}

// === 동영상 분석 ===

export function analyzeVideoClient(
  file: File,
  spec: AdFormatSpec
): Promise<ClientReviewResult> {
  return new Promise((resolve) => {
    const items: ReviewItem[] = [];

    // 파일 형식
    const isValidFormat = spec.allowedFormats.includes(file.type);
    items.push({
      id: "format",
      category: "기본",
      label: "파일 형식",
      status: isValidFormat ? "pass" : "fail",
      detail: isValidFormat ? "MP4 형식 확인" : `${file.type || "알 수 없는 형식"} → MP4만 허용`,
      guideline: "파일형식: MP4",
    });

    // 파일 용량
    const maxSizeMB = spec.maxFileSize / (1024 * 1024);
    const isValidSize = file.size <= spec.maxFileSize;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    items.push({
      id: "fileSize",
      category: "기본",
      label: "파일 용량",
      status: isValidSize ? "pass" : "fail",
      detail: isValidSize ? `${sizeMB}MB (${maxSizeMB}MB 이내)` : `${sizeMB}MB → ${maxSizeMB}MB 이내여야 합니다`,
      guideline: `파일용량: ${maxSizeMB}MB 이내`,
    });

    // 동영상 메타데이터 분석 (duration, resolution)
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // 영상 길이
      const duration = video.duration;
      const maxDuration = spec.maxDuration || 60;
      const isValidDuration = duration <= maxDuration;
      items.push({
        id: "duration",
        category: "기본",
        label: "영상 길이",
        status: isValidDuration ? "pass" : "fail",
        detail: isValidDuration
          ? `${duration.toFixed(1)}초 (${maxDuration}초 이내)`
          : `${duration.toFixed(1)}초 → ${maxDuration}초 이내여야 합니다`,
        guideline: `영상 길이: ${maxDuration}초 이내`,
      });

      // 해상도 (비율 체크)
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (spec.aspectRatio) {
        const [ratioW, ratioH] = spec.aspectRatio.split(":").map(Number);
        const expectedRatio = ratioW / ratioH;
        const actualRatio = videoWidth / videoHeight;
        const ratioDiff = Math.abs(actualRatio - expectedRatio);
        const isValidRatio = ratioDiff < 0.05; // 5% 오차 허용

        items.push({
          id: "aspectRatio",
          category: "기본",
          label: `화면 비율 (${spec.aspectRatio})`,
          status: isValidRatio ? "pass" : "fail",
          detail: isValidRatio
            ? `${videoWidth}x${videoHeight}px (${spec.aspectRatio} 비율 확인)`
            : `${videoWidth}x${videoHeight}px → ${spec.aspectRatio} 비율이 아닙니다`,
          guideline: `화면 비율: ${spec.aspectRatio}`,
        });
      }

      // 해상도 크기
      items.push({
        id: "resolution",
        category: "기본",
        label: "영상 해상도",
        status: videoWidth >= 720 ? "pass" : "warning",
        detail: `${videoWidth}x${videoHeight}px`,
        guideline: "최소 720p 이상 권장",
      });

      URL.revokeObjectURL(url);
      resolve({ items, backgroundColors: [] });
    };

    video.onerror = () => {
      items.push({
        id: "videoLoad",
        category: "기본",
        label: "동영상 로드",
        status: "fail",
        detail: "동영상을 로드할 수 없습니다. MP4 형식인지 확인해주세요.",
      });
      URL.revokeObjectURL(url);
      resolve({ items, backgroundColors: [] });
    };

    video.src = url;
  });
}
