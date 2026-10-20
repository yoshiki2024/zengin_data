/**
 * 全銀協フォーマット用 文字正規化・半角カナ変換ユーティリティ
 */
import Encoding from 'encoding-japanese';

// ひらがな・全角カタカナ小文字の大文字化マップ
const SMALL_KANA_MAP: Record<string, string> = {
  'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
  'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'わ',
  'ァ': 'ア', 'ィ': 'イ', 'ゥ': 'ウ', 'ェ': 'エ', 'ォ': 'オ',
  'ッ': 'ツ', 'ャ': 'ヤ', 'ュ': 'ユ', 'ョ': 'ヨ', 'ヮ': 'ワ',
  'ヵ': 'カ', 'ヶ': 'ケ',
  'ｧ': 'ｱ', 'ｨ': 'ｲ', 'ｩ': 'ｳ', 'ｪ': 'ｴ', 'ｫ': 'ｵ',
  'ｯ': 'ﾂ', 'ｬ': 'ﾔ', 'ｭ': 'ﾕ', 'ｮ': 'ﾖ'
};

// ひらがな -> カタカナ変換
export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) => {
    return String.fromCharCode(ch.charCodeAt(0) + 0x60);
  });
}

// 全角英数字・記号 -> 半角英数字・記号
export function zenkakuToHankakuAscii(str: string): string {
  return str
    .replace(/[！-～]/g, (ch) => {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    })
    .replace(/　/g, ' '); // 全角スペース -> 半角スペース
}

// 全角カタカナ -> 半角カタカナ変換マップ
const ZENKAKU_KANA_MAP: Record<string, string> = {
  'ガ': 'ｶﾞ', 'ギ': 'ｷﾞ', 'グ': 'ｸﾞ', 'ゲ': 'ｹﾞ', 'ゴ': 'ｺﾞ',
  'ザ': 'ｻﾞ', 'ジ': 'ｼﾞ', 'ズ': 'ｽﾞ', 'ゼ': 'ｾﾞ', 'ゾ': 'ｿﾞ',
  'ダ': 'ﾀﾞ', 'ヂ': 'ﾁﾞ', 'ヅ': 'ﾂﾞ', 'デ': 'ﾃﾞ', 'ド': 'ﾄﾞ',
  'バ': 'ﾊﾞ', 'ビ': 'ﾋﾞ', 'ブ': 'ﾌﾞ', 'ベ': 'ﾍﾞ', 'ボ': 'ﾎﾞ',
  'パ': 'ﾊﾟ', 'ピ': 'ﾋﾟ', 'プ': 'ﾌﾟ', 'ペ': 'ﾍﾟ', 'ポ': 'ﾎﾟ',
  'ヴ': 'ｳﾞ',
  'ア': 'ｱ', 'イ': 'ｲ', 'ウ': 'ｳ', 'エ': 'ｴ', 'オ': 'ｵ',
  'カ': 'ｶ', 'キ': 'ｷ', 'ク': 'ｸ', 'ケ': 'ｹ', 'コ': 'ｺ',
  'サ': 'ｻ', 'シ': 'ｼ', 'ス': 'ｽ', 'セ': 'ｾ', 'ソ': 'ｿ',
  'タ': 'ﾀ', 'チ': 'ﾁ', 'ツ': 'ﾂ', 'テ': 'ﾃ', 'ト': 'ﾄ',
  'ナ': 'ﾅ', 'ニ': 'ﾆ', 'ヌ': 'ﾇ', 'ネ': 'ﾈ', 'ノ': 'ﾉ',
  'ハ': 'ﾊ', 'ヒ': 'ﾋ', 'フ': 'ﾌ', 'ヘ': 'ﾍ', 'ホ': 'ﾎ',
  'マ': 'ﾏ', 'ミ': 'ﾐ', 'ム': 'ﾑ', 'メ': 'ﾒ', 'モ': 'ﾓ',
  'ヤ': 'ﾔ', 'ユ': 'ﾕ', 'ヨ': 'ﾖ',
  'ラ': 'ﾗ', 'リ': 'ﾘ', 'ル': 'ﾙ', 'レ': 'ﾚ', 'ロ': 'ﾛ',
  'ワ': 'ﾜ', 'ヲ': 'ｦ', 'ン': 'ﾝ',
  'ー': 'ｰ', '―': 'ｰ', '‐': 'ｰ', '−': 'ｰ', '–': 'ｰ',
  '「': '｢', '」': '｣', '、': '､', '。': '｡', '・': '･',
  '（': '(', '）': ')', '／': '/', '￥': '\\'
};

// 法人略称の自動置換マップ（全銀協規定略称）
export const CORPORATE_ABBR_MAP: [RegExp, string][] = [
  [/株式会社/g, '(ｶ)'],
  [/有限会社/g, '(ﾕ)'],
  [/合同会社/g, '(ﾄﾞ)'],
  [/合資会社/g, '(ｼ)'],
  [/合名会社/g, '(ﾒ)'],
  [/医療法人社団/g, '(ｲ)'],
  [/医療法人財団/g, '(ｲ)'],
  [/医療法人/g, '(ｲ)'],
  [/社会福祉法人/g, '(ﾌｸ)'],
  [/学校法人/g, '(ｶﾞｸ)'],
  [/一般社団法人/g, '(ｼｬ)'],
  [/公益社団法人/g, '(ｼｬ)'],
  [/一般財団法人/g, '(ｻﾞｲ)'],
  [/公益財団法人/g, '(ｻﾞｲ)'],
  [/特定非営利活動法人/g, '(ﾄｸﾋ)'],
  [/ＮＰＯ法人/gi, '(ﾄｸﾋ)'],
  [/NPO法人/gi, '(ﾄｸﾋ)'],
];

// 銀行名・支店名によくある漢字の変換マップ
export const BANK_KANJI_MAP: [RegExp, string][] = [
  [/銀行/g, ''],
  [/本店/g, 'ﾎﾝﾃﾝ'],
  [/支店/g, 'ｼﾃﾝ'],
  [/出張所/g, 'ｼﾕﾂﾁﾖｳｼﾞﾖ'],
  [/営業部/g, 'ｴｲｷﾞﾖｳﾌﾞ'],
  [/みずほ/g, 'ﾐｽﾞﾎ'],
  [/三菱[ＵU][ＦF][ＪJ]/g, 'ﾐﾂﾋﾞｼUFJ'],
  [/三井住友/g, 'ﾐﾂｲｽﾐﾄﾓ'],
  [/りそな/g, 'ﾘｿﾅ'],
  [/埼玉りそな/g, 'ｻｲﾀﾏﾘｿﾅ'],
  [/ゆうちょ/g, 'ﾕｳﾁﾖ'],
  [/楽天/g, 'ﾗｸﾃﾝ'],
  [/住信[ＳS][ＢB][ＩI]/g, 'ｽﾐｼﾝSBI'],
  [/PayPay|ＰａｙＰａｙ/g, 'ﾍﾟｲﾍﾟｲ'],
  [/あおぞら/g, 'ｱｵｿﾞﾗ'],
  [/新生/g, 'ｼﾝｾｲ'],
];

/**
 * 全銀標準仕様に準拠した文字正規化
 * 1. 法人略称の変換（株式会社 -> (ｶ) 等）
 * 2. ひらがなをカタカナに変換
 * 3. 促音・拗音などの小文字は大文字に変換（例: ｯ -> ﾂ, ｬ -> ﾔ）
 * 4. 全角英数を半角化、小文字英字は大文字へ変換 (例: abc -> ABC)
 * 5. 全角カナを半角カナに変換
 * 6. ハイフン類の半角化
 */
export function normalizeZenginString(input: string): string {
  if (!input) return '';

  let text = input;

  // 法人略称の自動変換
  for (const [re, abbr] of CORPORATE_ABBR_MAP) {
    text = text.replace(re, abbr);
  }

  // 1. ひらがなをカタカナに変換
  text = hiraganaToKatakana(text);

  // 2. 小文字カナを大文字カナに変換
  text = text.replace(/[ぁ-ょァ-ョｧ-ｮヵヶ]/g, (ch) => SMALL_KANA_MAP[ch] || ch);

  // 3. 全角英数・スペース・記号を半角へ
  text = zenkakuToHankakuAscii(text);

  // 4. 英小文字を英大文字に変換
  text = text.toUpperCase();

  // 5. 2文字カタカナ（濁音・半濁音）の置換
  for (const [zen, han] of Object.entries(ZENKAKU_KANA_MAP)) {
    text = text.split(zen).join(han);
  }

  // 6. ハイフン類似文字の半角ハイフン化
  text = text.replace(/[―ー–−―-]/g, '-');

  return text;
}

/**
 * 銀行名・支店名専用の正規化
 * 全銀協の規定では「銀行名・支店名は省略可（全桁半角スペース）」。
 * 漢字が含まれている場合は一般的な名称を半角カナに変換し、
 * それでも全銀規定外文字（未知の漢字など）が残る場合は、
 * 120バイト崩壊や銀行側エラーを100%防止するため「全桁半角スペース（省略）」に安全フォールバックする。
 */
export function normalizeBankOrBranchName(input: string): string {
  if (!input) return '';

  let text = input;
  for (const [re, rep] of BANK_KANJI_MAP) {
    text = text.replace(re, rep);
  }

  const normalized = normalizeZenginString(text);
  const check = isValidZenginChars(normalized);

  // 全銀で許可されない文字（漢字など）がまだ残っている場合は、全銀協の仕様通り省略（スペース）
  if (!check.valid) {
    return '';
  }

  return normalized;
}

/**
 * 全銀協フォーマットで許容される文字のみで構成されているかチェック
 * 許容:
 * - 半角英数大文字: A-Z, 0-9
 * - 半角カナ: ｦ-ﾟ (U+FF66 - U+FF9F)
 * - 記号: ( ) - . / \ スペース
 */
export function isValidZenginChars(str: string): { valid: boolean; invalidChars: string[] } {
  const invalidChars: string[] = [];
  const validPattern = /^[A-Z0-9\uFF66-\uFF9F\(\)\-\.\/\\ ]*$/;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (!validPattern.test(char)) {
      if (!invalidChars.includes(char)) {
        invalidChars.push(char);
      }
    }
  }

  return {
    valid: invalidChars.length === 0,
    invalidChars
  };
}

/**
 * Shift_JIS での正確なバイト数を取得
 */
export function getSjisByteLength(str: string): number {
  if (!str) return 0;
  const unicodeArray = Encoding.stringToCode(str);
  const sjisArray = Encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  return sjisArray.length;
}

/**
 * Shift_JISバイト数基準で右スペース埋め（左詰め）
 * targetBytes を絶対に超過しないよう安全にスライスし、不足分を半角スペースでパディング
 */
export function padRightBytes(str: string, targetBytes: number, padChar: string = ' '): string {
  if (!str) return padChar.repeat(targetBytes);

  let current = '';
  for (const ch of str) {
    const next = current + ch;
    if (getSjisByteLength(next) > targetBytes) {
      break;
    }
    current = next;
  }

  const currentBytes = getSjisByteLength(current);
  const remaining = Math.max(0, targetBytes - currentBytes);
  return current + padChar.repeat(remaining);
}

/**
 * Shift_JISバイト数基準で左ゼロ埋め（右詰め）
 */
export function padLeftBytes(str: string, targetBytes: number, padChar: string = '0'): string {
  if (!str) return padChar.repeat(targetBytes);

  let current = str;
  while (getSjisByteLength(current) > targetBytes) {
    current = current.slice(1);
  }

  const currentBytes = getSjisByteLength(current);
  const remaining = Math.max(0, targetBytes - currentBytes);
  return padChar.repeat(remaining) + current;
}

// 既存互換用
export const padRight = padRightBytes;
export const padLeft = padLeftBytes;
