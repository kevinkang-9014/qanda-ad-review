import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ReviewItem } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 콴다(QANDA) 광고 소재 검수 전문가입니다.
업로드된 풀 팝업 광고 이미지를 아래 가이드라인에 따라 꼼꼼히 검수해주세요.

## 풀 팝업 소재 가이드라인

### 로고 가이드
- 가로형 로고를 기본으로 사용하며 로고 외 다른 카피 작성은 불가능
- 로고는 가운데 정렬로 최상단 지정된 영역에 배치
- 가로형 로고: 최대 높이 48px / 세로형 로고: 최대 높이 110px

### 텍스트 가이드
- 폰트: Pretendard
- 헤드카피: 두줄, 띄어쓰기 포함 최대 16자, Bold
- 리드카피: 한줄, 띄어쓰기 포함 최대 18자, Medium
- 헤드카피와 리드카피를 합해 최대 2가지 컬러 사용 가능
- 채도(S)+명도(B) 합이 170을 초과하는 텍스트 컬러 금지
- 이모티콘 및 이모지 사용 금지
- 동일한 특수문자를 중복 사용하거나 과도하게 사용하는 것 금지

### 하단고지 영역
- 심의필문구, 카피라이트, 이미지 출처 표기만 작성 가능
- 크기 20pt / 행간 21pt / Medium
- 컬러: 흰색(#FFFFFF)과 검은색(#1C1C1C) 중 1개 선택

### 이미지 가이드
- 이미지 영역: 880px*960px
- 이미지는 시스템 영역과 겹치지 않도록 지정된 영역에만 배치
- 이미지 영역 전체 면적의 30%를 초과하는 크기의 텍스트 사용 금지
- 이미지 영역 전체에 브랜드의 로고, 텍스트를 가득 채우는 것 금지

### CTA 버튼 가이드
- 기본형 또는 자유형 중 선택
- 기본형: 더 알아보기, 선물받기, 참여하기, 신청하기, 구매하기
- 자유형: 띄어쓰기 포함 8자 이내, '~기' 용법으로 작성
- 영문, 특수문자, 이모지, 이모티콘 사용 금지
- CTA 텍스트: 검은색(#000000)과 흰색(#FFFFFF) 중 선택
- CTA 버튼 컬러: 채도(S)+명도(B) 합이 170을 초과하는 것 금지

응답은 반드시 아래 JSON 형식으로만 해주세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "items": [
    {
      "id": "항목ID",
      "category": "카테고리",
      "label": "항목명",
      "status": "pass 또는 fail 또는 warning",
      "detail": "구체적인 검수 결과 설명"
    }
  ]
}

다음 항목들을 검수해주세요:
1. logo_presence: 로고 존재 및 위치 (상단 중앙 영역)
2. logo_area_clean: 로고 영역에 다른 카피가 없는지
3. headline_length: 헤드카피 글자수 (2줄, 최대 16자)
4. leadcopy_length: 리드카피 글자수 (1줄, 최대 18자)
5. text_color_count: 헤드+리드 카피 컬러 수 (최대 2색)
6. no_emoji: 이모지/이모티콘 사용 여부
7. no_duplicate_special: 동일 특수문자 중복 사용 여부
8. cta_text: CTA 버튼 문구 (~기 형식 확인, 8자 이내)
9. cta_text_color: CTA 텍스트 색상 (흑/백만 허용)
10. bottom_notice: 하단고지 영역 (심의필/카피라이트/출처만)
11. image_text_ratio: 이미지 영역 내 텍스트 비율 (30% 미만)
12. overall_quality: 전체적인 소재 완성도 및 마무리`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here") {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "이미지 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType || "image/png",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: "이 풀 팝업 광고 소재를 가이드라인에 따라 검수해주세요. JSON 형식으로만 응답해주세요.",
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "AI 응답을 받지 못했습니다." },
        { status: 500 }
      );
    }

    let parsed: { items: ReviewItem[] };
    try {
      const jsonStr = textContent.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "AI 응답 파싱 실패", raw: textContent.text },
        { status: 500 }
      );
    }

    const items: ReviewItem[] = parsed.items.map((item) => ({
      ...item,
      status: (["pass", "fail", "warning"].includes(item.status)
        ? item.status
        : "warning") as ReviewItem["status"],
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("AI analyze error:", error);
    return NextResponse.json(
      { error: "AI 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
