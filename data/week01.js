/*
 * 1주차 — 교과서 속 한자어 (수학·과학·사회 + 生 + 한자어로 시작하는 중국어)
 * 출처: 진담중국어 카드뉴스 「뜻을 알면 교과서가 쉬워져요」(2026-10)
 *
 * 항목 설명은 data/_template.js 를 보세요.
 */
JINDAM.addWeek({
  id: "week01",
  no: 1,
  date: "2026-10-19",
  title: "교과서 속 한자어",
  subtitle: "수학 · 과학 · 사회 한자어 모음",
  intro: "글자를 쪼개 보면 공식보다 먼저 '뜻'이 보여요.",

  words: [
    // ── 수학
    {
      hanja: "分母", hangul: "분모", subject: "수학",
      parts: [["分", "나눌", "분"], ["母", "어미", "모"]],
      meaning: "전체를 똑같이 몇 부분으로 나누었는지 알려 주는 수",
      tip: "母(어미 모)에는 '근본·바탕'이라는 뜻도 있어요. 그래서 나누기 전 '전체'를 나타내요.",
      zh: "分母", py: "fēnmǔ", zhKo: "펀무"
    },
    {
      hanja: "直角", hangul: "직각", subject: "수학",
      parts: [["直", "곧을", "직"], ["角", "뿔", "각"]],
      meaning: "곧게 선 모서리, 바로 90°를 이루는 각",
      zh: "直角", py: "zhíjiǎo", zhKo: "즈쟈오"
    },
    {
      hanja: "約數", hangul: "약수", subject: "수학",
      parts: [["約", "묶을", "약"], ["數", "셈", "수"]],
      meaning: "어떤 수를 남김없이 나누어떨어지게 하는 수",
      zh: "约数", py: "yuēshù", zhKo: "위에슈"
    },
    {
      hanja: "平行", hangul: "평행", subject: "수학",
      parts: [["平", "평평할", "평"], ["行", "다닐", "행"]],
      meaning: "나란히 나아가서 끝까지 만나지 않는 두 선",
      zh: "平行", py: "píngxíng", zhKo: "핑싱"
    },

    // ── 과학
    {
      hanja: "光合成", hangul: "광합성", subject: "과학",
      parts: [["光", "빛", "광"], ["合", "합할", "합"], ["成", "이룰", "성"]],
      meaning: "빛을 받아 양분을 합쳐 만들어 내는 일",
      tip: "중국어에서는 光合作用(guānghé zuòyòng)이라고 해요.",
      zh: "光合作用", py: "guānghé zuòyòng", zhKo: "광허 쭤융"
    },
    {
      hanja: "蒸發", hangul: "증발", subject: "과학",
      parts: [["蒸", "찔", "증"], ["發", "필", "발"]],
      meaning: "열을 받은 물이 기체가 되어 피어오르는 것",
      zh: "蒸发", py: "zhēngfā", zhKo: "정파"
    },

    // ── 사회
    {
      hanja: "民主", hangul: "민주", subject: "사회",
      parts: [["民", "백성", "민"], ["主", "주인", "주"]],
      meaning: "국민이 나라의 주인이 되는 것",
      zh: "民主", py: "mínzhǔ", zhKo: "민주"
    },
    {
      hanja: "地形", hangul: "지형", subject: "사회",
      parts: [["地", "땅", "지"], ["形", "모양", "형"]],
      meaning: "산, 강, 평야처럼 땅이 생긴 모양",
      zh: "地形", py: "dìxíng", zhKo: "띠싱"
    },

    // ── 生(날 생)이 들어간 말
    {
      hanja: "學生", hangul: "학생", subject: "생활",
      parts: [["學", "배울", "학"], ["生", "날", "생"]],
      meaning: "학교에서 배우는 사람",
      zh: "学生", py: "xuésheng", zhKo: "쉬에셩"
    },
    {
      hanja: "生日", hangul: "생일", subject: "생활",
      parts: [["生", "날", "생"], ["日", "날", "일"]],
      meaning: "세상에 태어난 날",
      zh: "生日", py: "shēngrì", zhKo: "셩르"
    },
    {
      hanja: "生物", hangul: "생물", subject: "과학",
      parts: [["生", "날", "생"], ["物", "물건", "물"]],
      meaning: "살아 있는 모든 것 (동물·식물 등)",
      zh: "生物", py: "shēngwù", zhKo: "셩우"
    },
    {
      hanja: "生活", hangul: "생활", subject: "생활",
      parts: [["生", "날", "생"], ["活", "살", "활"]],
      meaning: "살아가면서 하루하루 지내는 일",
      zh: "生活", py: "shēnghuó", zhKo: "셩후어"
    },

    // ── 소리 내면 중국어가 되는 말
    {
      hanja: "準備", hangul: "준비", subject: "생활",
      parts: [["準", "준할", "준"], ["備", "갖출", "비"]],
      meaning: "필요한 것을 미리 갖추어 놓는 것",
      zh: "准备", py: "zhǔnbèi", zhKo: "준뻬이"
    },
    {
      hanja: "注意", hangul: "주의", subject: "생활",
      parts: [["注", "부을", "주"], ["意", "뜻", "의"]],
      meaning: "마음을 한곳에 쏟아 조심하는 것",
      zh: "注意", py: "zhùyì", zhKo: "주이"
    },
    {
      hanja: "運動", hangul: "운동", subject: "생활",
      parts: [["運", "옮길", "운"], ["動", "움직일", "동"]],
      meaning: "몸을 움직여 튼튼하게 하는 일",
      zh: "运动", py: "yùndòng", zhKo: "윈뚱"
    },
    {
      hanja: "安全", hangul: "안전", subject: "생활",
      parts: [["安", "편안할", "안"], ["全", "온전할", "전"]],
      meaning: "위험하지 않고 편안한 상태",
      zh: "安全", py: "ānquán", zhKo: "안취엔"
    },
    {
      hanja: "簡單", hangul: "간단", subject: "생활",
      parts: [["簡", "간략할", "간"], ["單", "홑", "단"]],
      meaning: "복잡하지 않고 쉬운 것",
      zh: "简单", py: "jiǎndān", zhKo: "지엔딴"
    }
  ],

  // 같은 글자 찾기 게임: 이 글자가 들어간 낱말을 고르는 게임
  keyChars: [
    {
      c: "生", hun: "날", eum: "생",
      // 이번 주 words 외에 더 보여 줄 낱말 (선택)
      extra: [
        { hanja: "先生", hangul: "선생" },
        { hanja: "生鮮", hangul: "생선" }
      ]
    }
  ]
});
