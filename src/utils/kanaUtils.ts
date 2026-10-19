/**
 * 全銀協フォーマット用 文字正規化・半角カナ変換ユーティリティ
 */

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

/**
 * 全銀標準仕様に準拠した文字正規化
 * 1. ひらがなをカタカナに変換
 * 2. 促音・拗音などの小文字は大文字に変換（例: ｯ -> ﾂ, ｬ -> ﾔ）
 * 3. 全角英数を半角化、小文字英字は大文字へ変換 (例: abc -> ABC)
 * 4. 全角カナを半角カナに変換
 * 5. 全銀協で使用可能な文字（半角カナ、半角英大文字、半角数字、一部記号 ()-./¥ スペース）にフィルタリング
 */
export function normalizeZenginString(input: string): string {
  if (!input) return '';

  // 1. ひらがなをカタカナに変換
  let text = hiraganaToKatakana(input);

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

  // 6. 残った文字のうち全銀フォーマット許容文字以外を安全に置換または除去
  // 許容文字: 半角数字 0-9, 半角英大文字 A-Z, 半角カナ ｦ-ﾟ, 記号 ()-./\ および半角スペース
  // ハイフン類似文字の半角ハイフン化
  text = text.replace(/[―ー–−―-]/g, '-');

  // 全銀で使用不可の文字（例: 株式会社などの漢字が入っている場合）の案内用
  return text;
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
 * 指定文字数でパディング（数字は右詰めゼロ埋め、カナ・英字は左詰めスペース埋め）
 * ※バイト数ではなく半角1文字=1バイトを前提（正規化済みの文字列）
 */
export function padRight(str: string, length: number, padChar: string = ' '): string {
  if (str.length >= length) {
    return str.slice(0, length);
  }
  return str + padChar.repeat(length - str.length);
}

export function padLeft(str: string, length: number, padChar: string = '0'): string {
  if (str.length >= length) {
    return str.slice(str.length - length);
  }
  return padChar.repeat(length - str.length) + str;
}
