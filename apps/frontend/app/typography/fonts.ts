import {
  BIZ_UDGothic,
  Manrope,
  Noto_Naskh_Arabic,
  Noto_Sans_Arabic,
  Noto_Sans_Hebrew,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Sans_Thai,
  Noto_Serif,
  Noto_Serif_Hebrew,
  Noto_Serif_JP,
  Noto_Serif_KR,
  Noto_Serif_SC,
  Noto_Serif_TC,
  Noto_Serif_Thai,
} from "next/font/google";

const manrope = Manrope({
  variable: "--font-sans-latin",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const bizUdGothic = BIZ_UDGothic({
  variable: "--font-sans-japanese",
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-sans-chinese-simplified",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSansTc = Noto_Sans_TC({
  variable: "--font-sans-chinese-traditional",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans-korean",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: "--font-sans-hebrew",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-sans-arabic",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans-thai",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerif = Noto_Serif({
  variable: "--font-serif-latin",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-serif-japanese",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerifSc = Noto_Serif_SC({
  variable: "--font-serif-chinese-simplified",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerifTc = Noto_Serif_TC({
  variable: "--font-serif-chinese-traditional",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-serif-korean",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerifHebrew = Noto_Serif_Hebrew({
  variable: "--font-serif-hebrew",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-serif-arabic",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-serif-thai",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const fontFaces = {
  sansLatin: manrope,
  sansJapanese: bizUdGothic,
  sansChineseSimplified: notoSansSc,
  sansChineseTraditional: notoSansTc,
  sansKorean: notoSansKr,
  sansHebrew: notoSansHebrew,
  sansArabic: notoSansArabic,
  sansThai: notoSansThai,
  serifLatin: notoSerif,
  serifJapanese: notoSerifJp,
  serifChineseSimplified: notoSerifSc,
  serifChineseTraditional: notoSerifTc,
  serifKorean: notoSerifKr,
  serifHebrew: notoSerifHebrew,
  serifArabic: notoNaskhArabic,
  serifThai: notoSerifThai,
} as const;

type FontFaceKey = keyof typeof fontFaces;

export type FontLanguageCode =
  | "ja"
  | "en"
  | "zh-Hans"
  | "zh-Hant"
  | "ko"
  | "he"
  | "ar"
  | "th";

export type FontDirection = "ltr" | "rtl";

export type FontLanguageProfile = {
  code: FontLanguageCode;
  label: string;
  direction: FontDirection;
  sans: FontFaceKey;
  serif: FontFaceKey;
};

export const fontLanguageProfiles = {
  ja: {
    code: "ja",
    label: "Japanese",
    direction: "ltr",
    sans: "sansJapanese",
    serif: "serifJapanese",
  },
  en: {
    code: "en",
    label: "English",
    direction: "ltr",
    sans: "sansLatin",
    serif: "serifLatin",
  },
  "zh-Hans": {
    code: "zh-Hans",
    label: "Chinese (Simplified)",
    direction: "ltr",
    sans: "sansChineseSimplified",
    serif: "serifChineseSimplified",
  },
  "zh-Hant": {
    code: "zh-Hant",
    label: "Chinese (Traditional)",
    direction: "ltr",
    sans: "sansChineseTraditional",
    serif: "serifChineseTraditional",
  },
  ko: {
    code: "ko",
    label: "Korean",
    direction: "ltr",
    sans: "sansKorean",
    serif: "serifKorean",
  },
  he: {
    code: "he",
    label: "Hebrew",
    direction: "rtl",
    sans: "sansHebrew",
    serif: "serifHebrew",
  },
  ar: {
    code: "ar",
    label: "Arabic",
    direction: "rtl",
    sans: "sansArabic",
    serif: "serifArabic",
  },
  th: {
    code: "th",
    label: "Thai",
    direction: "ltr",
    sans: "sansThai",
    serif: "serifThai",
  },
} as const satisfies Record<FontLanguageCode, FontLanguageProfile>;

export function getFontVariableClassName(): string {
  return Object.values(fontFaces)
    .map((font) => font.variable)
    .join(" ");
}
