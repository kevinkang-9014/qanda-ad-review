import { ReviewItem, ClientReviewResult, AdFormatSpec } from "./types";

// === PSD 기반 영역 좌표 (풀 팝업 1080x1566) ===
const FULL_POPUP_REGIONS = {
  logo: { left: 231, top: 53, right: 849, bottom: 173 }, // 가로형 + 세로형 통합
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

/** 영역 내 고유 색상 추출 (샘플링 방식) */
function sampleRegionColors(
  ctx: CanvasRenderingContext2D,
  region: Region,
  sampleCount = 200
): { hex: string; r: number; g: number; b: number; count: number }[] {
  const w = region.right - region.left;
  const h = region.bottom - region.top;
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < sampleCount; i++) {
    const x = region.left + Math.floor(Math.random() * w);
    const y = region.top + Math.floor(Math.random() * h);
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`.toUpperCase();
    const existing = colorMap.get(hex);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(hex, { r: pixel[0], g: pixel[1], b: pixel[2], count: 1 });
    }
  }

  return Array.from(colorMap.entries())
    .map(([hex, data]) => ({ hex, ...data }))
    .sort((a, b) => b.count - a.count);
}

/** 영역에 콘텐츠(비배경 픽셀)가 존재하는지 체크 */
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
    // 배경색과 충분히 다른 픽셀을 콘텐츠로 간주
    if (!bgColors.has(hex) && data[i + 3] > 128) {
      contentPixels++;
    }
  }

  const contentRatio = contentPixels / totalPixels;
  return { hasContent: contentRatio > threshold, contentRatio };
}

/** 텍스트 영역에서 고유 텍스트 색상 수 추출 (배경 제외) */
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
    if (data[i + 3] < 128) continue; // 투명 픽셀 스킵
    const hex = `#${data[i].toString(16).padStart(2, "0")}${data[i + 1].toString(16).padStart(2, "0")}${data[i + 2].toString(16).padStart(2, "0")}`.toUpperCase();
    if (bgColors.has(hex)) continue;

    // 유사 색상 그룹핑 (±10 RGB 범위)
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

  // 일정 비율 이상 등장하는 색상만 의미있는 텍스트 색상으로 카운트
  const significantColors = Array.from(colorMap.entries())
    .filter(([, count]) => count / totalPixels > minPixelRatio)
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);

  return { colors: significantColors, count: significantColors.length };
}

/** CTA 버튼 텍스트 색상이 흑(#000) 또는 백(#FFF)에 가까운지 체크 */
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

  // 흑색 (#000에 가까움) 또는 백색 (#FFF에 가까움) 허용
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

/** 이미지 영역 내 텍스트 비율 추정 (엣지 기반) */
function estimateTextRatio(
  ctx: CanvasRenderingContext2D,
  fullWidth: number,
  fullHeight: number,
  textRegion: Region,
  mainImageRegion: Region
): { ratio: number; pass: boolean } {
  // 텍스트 영역 면적
  const textAreaSize = (textRegion.right - textRegion.left) * (textRegion.bottom - textRegion.top);
  // 전체 이미지 면적 (CTA, 하단고지 제외한 본문 영역)
  const totalArea = fullWidth * fullHeight;

  // 텍스트 영역 내 실제 콘텐츠 비율 측정
  const w = textRegion.right - textRegion.left;
  const h = textRegion.bottom - textRegion.top;
  const imageData = ctx.getImageData(textRegion.left, textRegion.top, w, h);
  const data = imageData.data;

  // 엣지 감지 (Sobel-like): 인접 픽셀과 큰 차이가 있으면 텍스트/경계
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

// === 메인 분석 함수 ===

export function analyzeImageClient(
  file: File,
  spec: AdFormatSpec
): Promise<ClientReviewResult> {
  return new Promise((resolve) => {
    const items: ReviewItem[] = [];

    // 1. 파일 형식
    const isValidFormat = spec.allowedFormats.includes(file.type);
    items.push({
      id: "format",
      category: "기본",
      label: "파일 형식",
      status: isValidFormat ? "pass" : "fail",
      detail: isValidFormat ? "PNG 형식 확인" : `${file.type || "알 수 없는 형식"} → PNG만 허용`,
      guideline: "파일형식: PNG",
    });

    // 2. 파일 용량
    const isValidSize = file.size <= spec.maxFileSize;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    items.push({
      id: "fileSize",
      category: "기본",
      label: "파일 용량",
      status: isValidSize ? "pass" : "fail",
      detail: isValidSize ? `${sizeMB}MB (1MB 이내)` : `${sizeMB}MB → 1MB 이내여야 합니다`,
      guideline: "파일용량: 1MB 이내",
    });

    // 3. Canvas 기반 분석
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // 3-1. 이미지 크기
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

      const bgColors = sampleBackgroundColors(ctx, canvas.width, canvas.height);
      const bgColorSet = new Set(bgColors.map((c) => c.hex));

      // 3-2. 흰색 배경 금지
      const hasWhiteBg = bgColors.some((c) => c.hex === "#FFFFFF");
      items.push({
        id: "bgWhite",
        category: "배경",
        label: "흰색 배경 금지",
        status: hasWhiteBg ? "fail" : "pass",
        detail: hasWhiteBg ? "배경에 #FFFFFF(흰색) 감지됨 → 흰색 배경 사용 금지" : "흰색 배경 미감지",
        guideline: "배경 컬러: 하얀 배경 컬러(#FFFFFF) 사용 금지",
      });

      // 3-3. S+B 규정
      const violatingColors = bgColors.filter((c) => c.hsb.s + c.hsb.b > 170);
      const sbPass = violatingColors.length === 0;
      items.push({
        id: "bgSB",
        category: "배경",
        label: "배경색 S+B 규정 (≤170)",
        status: sbPass ? "pass" : "fail",
        detail: sbPass
          ? "배경색 S+B 값 모두 170 이하"
          : `S+B 초과: ${violatingColors.map((c) => `${c.hex} (S:${c.hsb.s}+B:${c.hsb.b}=${c.hsb.s + c.hsb.b})`).join(", ")}`,
        guideline: "채도(S)+명도(B) 합이 170을 초과하는 것을 금지",
      });

      // === PSD 좌표 기반 영역 검수 (이미지 크기가 맞을 때만) ===
      if (isValidDimension) {
        const R = FULL_POPUP_REGIONS;

        // 4. 로고 영역에 콘텐츠 존재 여부
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

        // 5. 헤드카피 영역에 콘텐츠 존재
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

        // 6. 리드카피 영역에 콘텐츠 존재
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

        // 7. 텍스트 색상 수 (헤드+리드 통합 영역)
        const textColorResult = countTextColors(ctx, R.textArea, bgColorSet);
        const textColorPass = textColorResult.count <= 2;
        items.push({
          id: "textColorCount",
          category: "텍스트",
          label: "텍스트 컬러 수 (최대 2색)",
          status: textColorPass ? "pass" : "fail",
          detail: textColorPass
            ? `텍스트 색상 ${textColorResult.count}색 감지: ${textColorResult.colors.slice(0, 2).join(", ")}`
            : `텍스트 색상 ${textColorResult.count}색 감지: ${textColorResult.colors.slice(0, 4).join(", ")} → 최대 2색까지만 허용`,
          guideline: "헤드카피+리드카피 텍스트 컬러는 최대 2가지",
        });

        // 8. CTA 버튼 존재 여부
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

        // 9. CTA 텍스트 색상 (흑 or 백)
        if (ctaCheck.hasContent) {
          const ctaColorResult = checkCtaTextColor(ctx, R.cta, bgColorSet);
          items.push({
            id: "ctaTextColor",
            category: "CTA",
            label: "CTA 텍스트 색상 (흑/백)",
            status: ctaColorResult.pass ? "pass" : "fail",
            detail: ctaColorResult.detail,
            guideline: "CTA 버튼 텍스트는 흑(#000) 또는 백(#FFF)만 허용",
          });
        }

        // 10. 하단고지 존재 여부
        const bottomCheck = hasContentInRegion(ctx, R.bottomNotice, bgColorSet, 0.01);
        items.push({
          id: "bottomNotice",
          category: "하단고지",
          label: "하단고지 존재",
          status: bottomCheck.hasContent ? "pass" : "warning",
          detail: bottomCheck.hasContent
            ? `하단고지 영역에 콘텐츠 감지 (${(bottomCheck.contentRatio * 100).toFixed(1)}%)`
            : "하단고지 영역에 콘텐츠가 없습니다 — 심의필/카피라이트 필요",
          guideline: "하단고지: 심의필, 카피라이트, 출처 등 필수",
        });

        // 11. 텍스트 비율 (30% 미만)
        const textRatioResult = estimateTextRatio(ctx, canvas.width, canvas.height, R.textArea, R.mainImage);
        items.push({
          id: "textRatio",
          category: "레이아웃",
          label: "텍스트 비율 (30% 미만)",
          status: textRatioResult.pass ? "pass" : "warning",
          detail: `이미지 내 텍스트 영역 비율: 약 ${textRatioResult.ratio}%${textRatioResult.pass ? "" : " → 30% 미만 권장"}`,
          guideline: "이미지 내 텍스트가 전체의 30%를 넘지 않아야 합니다",
        });

        // 12. 로고 영역 밖 상단에 텍스트 없는지 (로고 위 영역 체크)
        const aboveLogoRegion = { left: 0, top: 0, right: canvas.width, bottom: R.logo.top };
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
      }

      URL.revokeObjectURL(url);
      resolve({ items, backgroundColors: bgColors });
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
