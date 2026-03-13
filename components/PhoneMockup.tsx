"use client";

import { useRef, useCallback } from "react";
import { toJpeg } from "html-to-image";

interface PhoneMockupProps {
  imageUrl: string;
  formatId: string;
  textValues?: Record<string, string>;
  logoUrl?: string | null;
}

export default function PhoneMockup({ imageUrl, formatId, textValues, logoUrl }: PhoneMockupProps) {
  const mockupRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (!mockupRef.current) return;
    try {
      const dataUrl = await toJpeg(mockupRef.current, {
        quality: 0.85,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `qanda-${formatId}-preview.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("미리보기 다운로드 실패:", err);
    }
  }, [formatId]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={mockupRef}>
        {formatId === "fullPopup" ? (
          <FullPopupMockup imageUrl={imageUrl} />
        ) : formatId === "splash" ? (
          <SplashMockup imageUrl={imageUrl} />
        ) : formatId === "communityBanner" ? (
          <CommunityBannerMockup imageUrl={imageUrl} textValues={textValues} logoUrl={logoUrl} />
        ) : formatId === "videoHorizontal" ? (
          <SearchHorizontalMockup videoUrl={imageUrl} textValues={textValues} />
        ) : formatId === "videoVertical" ? (
          <SearchVerticalMockup videoUrl={imageUrl} textValues={textValues} logoUrl={logoUrl} />
        ) : (
          <div className="flex justify-center">
            <img src={imageUrl} alt="Preview" className="max-w-full max-h-[500px] rounded-lg" />
          </div>
        )}
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        미리보기 이미지 다운로드 (JPG)
      </button>
    </div>
  );
}

function QandaLogo({ size = 16 }: { size?: number }) {
  return (
    <img
      src="/qanda-symbol.png"
      alt="QANDA"
      width={size}
      height={size}
      style={{ borderRadius: size * 0.2 }}
    />
  );
}

function FullPopupMockup({ imageUrl }: { imageUrl: string }) {
  const S = 320 / 1080;

  const SCREEN_W = 320;
  const APP_HEADER_H = 33; // 앱헤더 1.1배
  const GRAY_TOP_PAD = 12; // 회색 영역 상단 여백
  const TIMER_H = 55; // 타이머 카드 1.1배
  const AD_H = Math.round(1566 * S); // 464px
  const CLOSE_H = 56; // 닫기 영역
  const NAV_H = 40; // 하단 네비 2배
  const PHONE_PADDING = 8;

  // 타이머가 소재 뒤에서 상단만 살짝 보이도록 위치 계산
  const AD_TOP = GRAY_TOP_PAD + APP_HEADER_H + 8 + TIMER_H - 25;
  const AD_IMAGE_TOP = AD_TOP + 18; // 광고 이미지 실제 시작 위치

  // 스크린 높이 = 네비게이터 하단까지만 컷팅 (배율 유지)
  const SCREEN_H = AD_IMAGE_TOP + AD_H + CLOSE_H + NAV_H;

  return (
    <div className="flex justify-center p-2" style={{ isolation: "isolate" }}>
      <div
        className="relative rounded-[40px] shadow-lg border-2 border-gray-300"
        style={{
          width: SCREEN_W + PHONE_PADDING * 2,
          backgroundColor: "#e5e7eb",
          padding: PHONE_PADDING,
        }}
      >
        {/* Phone notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 rounded-b-xl"
          style={{ width: 90, height: 20, backgroundColor: "#e5e7eb" }}
        />

        {/* Screen */}
        <div
          className="rounded-[32px] overflow-hidden relative"
          style={{ width: SCREEN_W, height: SCREEN_H, backgroundColor: "#f3f4f6" }}
        >
          {/* ====== Base Layer: Gray bg + App Header + Timer ====== */}
          <div className="absolute inset-0" style={{ backgroundColor: "#f3f4f6" }}>
            {/* App Header - 회색 배경 영역 안, 1.1배 크기 */}
            <div
              className="flex items-center justify-between px-3"
              style={{ height: APP_HEADER_H, marginTop: GRAY_TOP_PAD }}
            >
              <div className="flex items-center gap-1.5" style={{ transform: "scale(1.1)", transformOrigin: "left center" }}>
                <QandaLogo size={22} />
                <span className="text-[11px] font-medium text-gray-700 bg-gray-200 px-1.5 py-[2px] rounded text-center">Basic</span>
              </div>
              <div className="flex items-center gap-2" style={{ transform: "scale(1.1)", transformOrigin: "right center" }}>
                <div className="flex items-center gap-0.5 bg-gray-200 px-1.5 py-[2px] rounded">
                  <span className="text-[10px] text-orange-500">⚡</span>
                  <span className="text-[11px] font-medium text-gray-700">2531</span>
                </div>
                <div className="flex items-center gap-0.5 bg-gray-200 px-1.5 py-[2px] rounded">
                  <span className="text-[11px]">🔔</span>
                  <span className="text-[11px] font-medium text-gray-700">39</span>
                </div>
              </div>
            </div>

            {/* Timer card - 소재 뒤에서 상단이 살짝 보임 */}
            <div
              className="mx-3 bg-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between"
              style={{ marginTop: 8, height: TIMER_H }}
            >
              <div>
                <div className="inline-flex items-center gap-1 bg-gray-300/60 px-1.5 py-[1px] rounded-full mb-0.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="text-[9px] text-gray-500 font-medium">대기 중</span>
                </div>
                <p className="text-gray-800 text-[20px] font-bold leading-tight">00:00</p>
              </div>
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white ml-0.5" />
              </div>
            </div>
          </div>

          {/* ====== 단일 딤 오버레이: 최상단 ~ 소재 둥근 모서리 덮기 ====== */}
          <div
            className="absolute left-0 right-0 z-10"
            style={{
              top: 0,
              height: AD_IMAGE_TOP + 14, // 둥근 모서리(14px) 영역까지 덮음
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />

          {/* ====== Ad Popup Layer ====== */}
          {/* Page indicator - 광고 이미지 상단 우측 */}
          <div
            className="absolute z-20 flex justify-end px-3"
            style={{ top: AD_IMAGE_TOP + 6, left: 0, right: 0 }}
          >
            <span className="text-[9px] text-white bg-black/50 px-2 py-[2px] rounded-full">1/5</span>
          </div>

          {/* Ad Image - 중앙정렬, 좌우 상단 둥글게 */}
          <div
            className="absolute left-0 right-0 z-10 flex justify-center"
            style={{ top: AD_IMAGE_TOP }}
          >
            <div
              className="overflow-hidden"
              style={{
                width: SCREEN_W,
                height: AD_H,
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
              }}
            >
              <img
                src={imageUrl}
                alt="Ad Preview"
                className="w-full h-full object-fill"
              />
            </div>
          </div>

          {/* 닫기 button - white bar */}
          <div
            className="absolute left-0 right-0 z-10 bg-white flex items-center justify-center"
            style={{ top: AD_IMAGE_TOP + AD_H, height: CLOSE_H }}
          >
            <span className="text-[14px] text-gray-700 font-medium">닫기</span>
          </div>

          {/* Bottom navigation bar - 2배 크기 */}
          <div
            className="absolute left-0 right-0 z-10 bg-gray-900 flex items-center justify-around px-8"
            style={{ top: AD_IMAGE_TOP + AD_H + CLOSE_H, height: NAV_H }}
          >
            <div className="flex flex-col items-center gap-[2px]">
              <div className="w-4 h-[3px] bg-gray-500" />
              <div className="w-4 h-[3px] bg-gray-500" />
              <div className="w-4 h-[3px] bg-gray-500" />
            </div>
            <div className="w-4 h-4 border-[1.5px] border-gray-500 rounded-[3px]" />
            <div className="text-gray-500 text-[14px]">&lt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplashMockup({ imageUrl }: { imageUrl: string }) {
  // ====== 실제 게재면 기준 (1080x2400 스크린, 광고 1754x585) ======
  // 안전영역(x:452~1302 = 850px)이 1080px 폰 화면에 꽉 참
  // → 목업에서도 동일 비율 적용
  const SCREEN_W = 320;
  const S = SCREEN_W / 1080; // 목업 축소 비율 0.296
  const SCREEN_H = Math.round(2400 * S); // 711px
  const NAV_H = Math.round(96 * S); // 안드로이드 네비바 (~28px)
  const PHONE_PADDING = 8;

  // 안전영역 기준 스케일: 폰 화면(1080) = 안전영역(850) → 비율 1080/850
  // 광고 이미지를 이 비율로 확대하여 안전영역이 화면 너비에 맞게 표시
  const SAFE_TO_SCREEN = 1080 / 850; // ≈ 1.271
  const AD_RENDER_W = Math.round(1754 * SAFE_TO_SCREEN * S); // 1754 * 1.271 * 0.296 ≈ 660px
  const AD_RENDER_H = Math.round(585 * SAFE_TO_SCREEN * S); // 585 * 1.271 * 0.296 ≈ 220px
  const AD_OFFSET_X = Math.round(452 * SAFE_TO_SCREEN * S); // 좌측 오프셋 ≈ 170px

  // 광고 위치: 네비바 바로 위
  const AD_TOP = SCREEN_H - NAV_H - AD_RENDER_H;

  // 로고 위치: 광고 영역 위쪽의 중앙
  const LOGO_CENTER_Y = Math.round(AD_TOP * 0.42);

  return (
    <div className="flex justify-center p-2" style={{ isolation: "isolate" }}>
      <div
        className="relative rounded-[40px] shadow-lg border-2 border-gray-300"
        style={{
          width: SCREEN_W + PHONE_PADDING * 2,
          backgroundColor: "#e5e7eb",
          padding: PHONE_PADDING,
        }}
      >
        {/* Phone notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 rounded-b-xl"
          style={{ width: 90, height: 20, backgroundColor: "#e5e7eb" }}
        />

        {/* Screen */}
        <div
          className="rounded-[32px] overflow-hidden relative bg-white"
          style={{ width: SCREEN_W, height: SCREEN_H }}
        >
          {/* ====== QANDA 텍스트 로고: 최상단 ~ 네비바 윗선 기준 정중앙 ====== */}
          <div
            className="absolute left-0 right-0 flex items-center justify-center bg-white"
            style={{ zIndex: 0, top: 0, height: SCREEN_H - NAV_H }}
          >
            <img
              src="/qanda-text-logo.png"
              alt="QANDA"
              style={{
                width: Math.round(140 * 1.15),
                height: "auto",
              }}
            />
          </div>

          {/* ====== 광고 이미지 (background-image로 안전영역 크롭 표시) ====== */}
          <div
            className="absolute z-10"
            style={{
              top: AD_TOP,
              left: 0,
              width: SCREEN_W,
              height: AD_RENDER_H,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${AD_RENDER_W}px ${AD_RENDER_H}px`,
              backgroundPosition: `-${AD_OFFSET_X}px 0`,
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* ====== Bottom navigation bar (안드로이드 스타일) ====== */}
          <div
            className="absolute left-0 right-0 z-10 bg-white flex items-center justify-around px-8"
            style={{
              top: SCREEN_H - NAV_H,
              height: NAV_H,
            }}
          >
            <div className="flex flex-col items-center gap-[2px]">
              <div className="w-4 h-[3px] bg-gray-400" />
              <div className="w-4 h-[3px] bg-gray-400" />
              <div className="w-4 h-[3px] bg-gray-400" />
            </div>
            <div className="w-4 h-4 border-[1.5px] border-gray-400 rounded-[3px]" />
            <div className="text-gray-400 text-[14px]">&lt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityBannerMockup({ imageUrl, textValues, logoUrl }: { imageUrl: string; textValues?: Record<string, string>; logoUrl?: string | null }) {
  const SCREEN_W = 320;
  const SCREEN_H = 693;
  const PHONE_PADDING = 8;
  // 비광고 텍스트/요소 스케일
  const T = 1.35; // text scale (1.5 × 0.9)
  const P = 1.275; // proportion scale for non-ad elements (1.5 × 0.85)
  const N = 2;     // nav scale

  return (
    <div className="flex justify-center p-2" style={{ isolation: "isolate" }}>
      <div
        className="relative rounded-[40px] shadow-lg border-2 border-gray-300"
        style={{
          width: SCREEN_W + PHONE_PADDING * 2,
          backgroundColor: "#e5e7eb",
          padding: PHONE_PADDING,
        }}
      >
        {/* Phone notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 rounded-b-xl"
          style={{ width: 90, height: 20, backgroundColor: "#e5e7eb" }}
        />

        {/* Screen */}
        <div
          className="rounded-[32px] overflow-hidden relative bg-white"
          style={{ width: SCREEN_W, height: SCREEN_H }}
        >
          {/* ====== Status Bar ====== */}
          <div className="flex items-center justify-between px-5 pt-2" style={{ height: Math.round(24 * P) }}>
            <span style={{ fontSize: 8 * T }} className="font-semibold text-gray-800">9:51</span>
            <div className="flex items-center gap-1">
              <div style={{ width: 2.5 * P, height: 2.5 * P }} className="border border-gray-500 rounded-sm" />
              <span style={{ fontSize: 7 * T }} className="text-gray-500">63%</span>
            </div>
          </div>

          {/* ====== 커뮤니티 Header ====== */}
          <div className="flex items-center justify-between px-4 pt-1 pb-1">
            <span style={{ fontSize: 15 * T }} className="font-bold text-gray-900">커뮤니티</span>
            <div className="flex items-center" style={{ gap: 2.5 * P }}>
              <svg style={{ width: 4 * P, height: 4 * P }} className="text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <svg style={{ width: 4 * P, height: 4 * P }} className="text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <svg style={{ width: 4 * P, height: 4 * P }} className="text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
          </div>

          {/* ====== Tab Bar ====== */}
          <div className="flex items-center px-4 pb-2 border-b border-gray-100" style={{ gap: 3 * P * 1.2 }}>
            <span style={{ fontSize: 10 * T }} className="text-gray-400">소통해요</span>
            <span style={{ fontSize: 10 * T }} className="font-bold text-gray-900 border-b-2 border-gray-900 pb-0.5">공부해요</span>
            <span style={{ fontSize: 10 * T }} className="text-gray-400">문제풀이</span>
            <span style={{ fontSize: 10 * T }} className="text-gray-400">내 그룹</span>
          </div>

          {/* ====== Filter Chips ====== */}
          <div className="flex items-center px-4 py-2" style={{ gap: 1.5 * P }}>
            <div className="flex items-center gap-0.5 border border-gray-300 rounded-full justify-center" style={{ padding: `${0.5 * P}px ${2 * P}px` }}>
              <span style={{ fontSize: 8 * T, letterSpacing: "0.1em" }} className="text-gray-700">고등</span>
              <span style={{ fontSize: 7 * T }} className="text-gray-400">▼</span>
            </div>
            <div className="bg-gray-900 rounded-full flex items-center justify-center" style={{ padding: `${0.5 * P}px ${2 * P}px` }}>
              <span style={{ fontSize: 8 * T, letterSpacing: "0.1em" }} className="text-white font-medium">전체</span>
            </div>
            {["인기", "공부법", "인증", "입시·진로"].map((label) => (
              <div key={label} className="border border-gray-200 rounded-full flex items-center justify-center" style={{ padding: `${0.5 * P}px ${2 * P}px` }}>
                <span style={{ fontSize: 8 * T, letterSpacing: "0.1em" }} className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* ====== User Post 위쪽 ====== */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p style={{ fontSize: 9 * T }} className="font-bold text-gray-800 mb-0.5">선택과목</p>
            <p style={{ fontSize: 7 * T }} className="text-gray-500 leading-tight line-clamp-2">
              여러분 제가 건축(공)학과 희망하는 고2학생입니다. 저는 정시파이터인데요. 선택과목을 과탐을 선택하는게 아닌 사탐2개로 ...
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <span style={{ fontSize: 7 * T }} className="text-gray-400 bg-gray-100 px-1.5 py-[1px] rounded">입시·진로</span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 7 * T }} className="text-gray-400">♡ 0</span>
                <span style={{ fontSize: 7 * T }} className="text-gray-400">💬 2</span>
              </div>
            </div>
          </div>

          {/* ====== AD Section (광고 — T 스케일 적용) ====== */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            {/* Brand + AD badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="rounded-full bg-gray-200 overflow-hidden flex items-center justify-center" style={{ width: 5 * T * 1.4 * 1.2, height: 5 * T * 1.4 * 1.2 }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="브랜드 로고" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-400" />
                )}
              </div>
              <span style={{ fontSize: 9 * T }} className="font-medium text-gray-800">{textValues?.brandName || "브랜드명"}</span>
              <span style={{ fontSize: 7 * T }} className="text-gray-400 bg-gray-100 px-1 py-[1px] rounded">AD</span>
            </div>
            {/* Headline + Lead copy */}
            <p style={{ fontSize: 9 * T }} className="font-bold text-gray-900 mb-0.5">{textValues?.headline || "헤드카피 표시 영역"}</p>
            <p style={{ fontSize: 7.5 * T }} className="text-gray-600 leading-tight mb-2 whitespace-pre-line">{textValues?.leadCopy || "리드카피 표시 영역"}</p>
            {/* Main Banner Image (984x720) */}
            <div
              className="w-full rounded-lg overflow-hidden"
              style={{ aspectRatio: "984/720" }}
            >
              <img
                src={imageUrl}
                alt="커뮤니티 배너 광고"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* ====== User Post 아래쪽 ====== */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div style={{ width: 4 * P, height: 4 * P }} className="rounded-full bg-red-200" />
              <span style={{ fontSize: 8 * T }} className="text-gray-700">조용히해알베르토</span>
              <span style={{ fontSize: 7 * T }} className="text-gray-400 bg-gray-100 px-1 py-[0.5px] rounded">Lv.1</span>
            </div>
            <p style={{ fontSize: 9 * T }} className="font-bold text-gray-800">수학 못하는 이과 미적분으로 수능봐도 될까요</p>
          </div>

          {/* ====== Bottom Navigation (2x, icons only) ====== */}
          <div
            className="absolute left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-2"
            style={{ bottom: Math.round(20 * N), height: Math.round(44 * N) }}
          >
            <div className="flex items-center justify-center">
              <svg style={{ width: 3.5 * N * 2, height: 3.5 * N * 2 }} className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <div className="flex items-center justify-center">
              <svg style={{ width: 3.5 * N * 2, height: 3.5 * N * 2 }} className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="flex items-center justify-center">
              <svg style={{ width: 3.5 * N * 2, height: 3.5 * N * 2 }} className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <div className="flex items-center justify-center">
              <svg style={{ width: 3.5 * N * 2, height: 3.5 * N * 2 }} className="text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
            </div>
            <div className="flex items-center justify-center">
              <svg style={{ width: 3.5 * N * 2, height: 3.5 * N * 2 }} className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </div>
          </div>

          {/* ====== Android Navigation Bar (2x) ====== */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white flex items-center justify-around px-8"
            style={{ height: 20 * N }}
          >
            <div className="flex flex-row items-center" style={{ gap: 1 * N }}>
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
            </div>
            <div style={{ width: 5 * N, height: 5 * N }} className="border border-gray-400 rounded-[2px]" />
            <div className="text-gray-400" style={{ fontSize: 10 * N }}>&lt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchHorizontalMockup({ videoUrl, textValues }: { videoUrl: string; textValues?: Record<string, string> }) {
  const SCREEN_W = 320;
  const SCREEN_H = 710;
  const PHONE_PADDING = 8;
  const S = SCREEN_W / 1080; // ≈ 0.296
  const N = 2; // nav scale

  // 비디오 영역 (16:9)
  const VIDEO_W = SCREEN_W;
  const VIDEO_H = Math.round(SCREEN_W * 9 / 16); // 180px

  return (
    <div className="flex justify-center p-2" style={{ isolation: "isolate" }}>
      <div
        className="relative rounded-[40px] shadow-lg border-2 border-gray-300"
        style={{
          width: SCREEN_W + PHONE_PADDING * 2,
          backgroundColor: "#e5e7eb",
          padding: PHONE_PADDING,
        }}
      >
        {/* Phone notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 rounded-b-xl"
          style={{ width: 90, height: 20, backgroundColor: "#e5e7eb" }}
        />

        {/* Screen */}
        <div
          className="rounded-[32px] overflow-hidden relative bg-white"
          style={{ width: SCREEN_W, height: SCREEN_H }}
        >
          {/* ====== Status Bar ====== */}
          <div className="flex items-center justify-between px-5 pt-2" style={{ height: 24 }}>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-semibold text-gray-800">SKT</span>
              <span className="text-[9px] font-medium text-gray-700">4:16</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-gray-500">5G</span>
              <div className="flex items-end gap-[1px]">
                <div className="w-[2px] h-[4px] bg-gray-800" />
                <div className="w-[2px] h-[6px] bg-gray-800" />
                <div className="w-[2px] h-[8px] bg-gray-800" />
                <div className="w-[2px] h-[10px] bg-gray-300" />
              </div>
              <span className="text-[8px] text-gray-700">39%</span>
              <div className="w-[14px] h-[7px] border border-gray-500 rounded-[1px] relative">
                <div className="absolute left-[1px] top-[1px] bottom-[1px] bg-gray-500" style={{ width: "39%" }} />
              </div>
            </div>
          </div>

          {/* ====== 상단 여백 + "문제를 해결할 풀이를 찾았어요!" ====== */}
          <div className="flex items-center justify-center" style={{ height: 132 }}>
            <p className="text-[13px] font-bold text-gray-900 text-center">문제를 해결할 풀이를 찾았어요!</p>
          </div>

          {/* ====== 비디오 광고 영역 (16:9) ====== */}
          <div className="relative" style={{ width: VIDEO_W, height: VIDEO_H }}>
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
            {/* 음소거 버튼 (좌하단) */}
            <div
              className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            </div>
          </div>

          {/* ====== AD Info Section (헤드카피 + 리드카피 + CTA) ====== */}
          <div className="px-4 py-4 flex items-center justify-between" style={{ minHeight: 64 }}>
            <div className="flex-1 pr-3">
              <p className="text-[13px] font-bold text-gray-900 leading-tight">
                {textValues?.headline || "헤드카피 표시 영역"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                {textValues?.leadCopy || "리드카피 표시 영역"}
              </p>
            </div>
            <button className="bg-gray-900 text-white text-[11px] font-bold px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0">
              {textValues?.cta || "바로가기"}
            </button>
          </div>

          {/* ====== 여백 영역 ====== */}
          <div style={{ height: 120 }} />

          {/* ====== QANDA Premium 배너 ====== */}
          <div className="mx-4 bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">광고 없이 공부에만 집중할 수 있는</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <QandaLogo size={14} />
                <span className="bg-orange-500 text-white text-[7px] font-bold px-1.5 py-[1px] rounded">Premium</span>
                <span className="text-[11px] font-bold text-gray-800">콴다 프리미엄 체험하기</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* ====== "검색 결과 보기" 버튼 ====== */}
          <div className="px-4 mt-3">
            <div className="w-full bg-orange-500 text-white text-center text-[13px] font-bold py-3 rounded-xl">
              검색 결과 보기
            </div>
          </div>

          {/* ====== Android Navigation Bar ====== */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white flex items-center justify-around px-8"
            style={{ height: 20 * N }}
          >
            <div className="flex flex-row items-center" style={{ gap: 1 * N }}>
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
            </div>
            <div style={{ width: 5 * N, height: 5 * N }} className="border border-gray-400 rounded-[2px]" />
            <div className="text-gray-400" style={{ fontSize: 10 * N }}>&lt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchVerticalMockup({ videoUrl, textValues, logoUrl }: { videoUrl: string; textValues?: Record<string, string>; logoUrl?: string | null }) {
  const SCREEN_W = 320;
  const SCREEN_H = 710;
  const PHONE_PADDING = 8;
  const N = 2;

  const NAV_H = 20 * N; // 40px
  const BLACK_BAR_TOP = 50; // 상단 블랙바
  const BLACK_BAR_BOTTOM = 24; // 하단 블랙바 (네비바 위)
  const CTA_BOTTOM = NAV_H + BLACK_BAR_BOTTOM + 12; // CTA 라인 위치

  return (
    <div className="flex justify-center p-2" style={{ isolation: "isolate" }}>
      <div
        className="relative rounded-[40px] shadow-lg border-2 border-gray-300"
        style={{
          width: SCREEN_W + PHONE_PADDING * 2,
          backgroundColor: "#e5e7eb",
          padding: PHONE_PADDING,
        }}
      >
        {/* Phone notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20 rounded-b-xl"
          style={{ width: 90, height: 20, backgroundColor: "#e5e7eb" }}
        />

        {/* Screen */}
        <div
          className="rounded-[32px] overflow-hidden relative bg-black"
          style={{ width: SCREEN_W, height: SCREEN_H }}
        >
          {/* ====== 비디오 (상하 블랙바 사이) ====== */}
          <div
            className="absolute left-0 right-0"
            style={{ top: BLACK_BAR_TOP, bottom: NAV_H + BLACK_BAR_BOTTOM }}
          >
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          </div>

          {/* ====== 상단 블랙바 ====== */}
          <div className="absolute top-0 left-0 right-0 bg-black" style={{ height: BLACK_BAR_TOP }} />

          {/* ====== 하단 블랙바 (네비바 위) ====== */}
          <div
            className="absolute left-0 right-0 bg-black"
            style={{ bottom: NAV_H, height: BLACK_BAR_BOTTOM }}
          />

          {/* ====== 음소거 + CTA 같은 라인 ====== */}
          <div
            className="absolute left-0 right-0 z-10 flex items-center px-3"
            style={{ bottom: CTA_BOTTOM }}
          >
            {/* 음소거 버튼 */}
            <div className="w-7 h-7 rounded-full bg-black/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            </div>

            {/* CTA 둥근 캡슐 버튼 */}
            <div className="flex-1 ml-2 flex items-center bg-black/50 rounded-full px-3 py-2">
              {/* 브랜드 로고 */}
              <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="브랜드 로고" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-400" />
                )}
              </div>

              {/* 브랜드명 + CTA 텍스트 */}
              <div className="flex-1 ml-2.5 min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight truncate">
                  {textValues?.brandName || "브랜드명"}
                </p>
                <p className="text-[9px] text-gray-300 leading-tight truncate">
                  {textValues?.cta || "지금 들으러가기"}
                </p>
              </div>

              {/* 화살표 */}
              <svg className="w-5 h-5 text-white flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* ====== Android Navigation Bar ====== */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white flex items-center justify-around px-8"
            style={{ height: NAV_H }}
          >
            <div className="flex flex-row items-center" style={{ gap: 1 * N }}>
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
              <div style={{ width: 1 * N, height: 3 * N }} className="bg-gray-400" />
            </div>
            <div style={{ width: 5 * N, height: 5 * N }} className="border border-gray-400 rounded-[2px]" />
            <div className="text-gray-400" style={{ fontSize: 10 * N }}>&lt;</div>
          </div>
        </div>
      </div>
    </div>
  );
}
