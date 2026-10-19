export type TransferType = '21' | '11' | '12' | '91';

export interface TransferTypeOption {
  code: TransferType;
  label: string;
  description: string;
}

export const TRANSFER_TYPES: TransferTypeOption[] = [
  { code: '21', label: '総合振込', description: '通常の取引先への支払・買掛金決済など（種別コード: 21）' },
  { code: '11', label: '給与振込', description: '役員報酬・従業員給与の支払い（種別コード: 11）' },
  { code: '12', label: '賞与振込', description: '賞与・ボーナスの支払い（種別コード: 12）' },
];

export type AccountType = '1' | '2' | '4' | '9';

export const ACCOUNT_TYPES: { code: AccountType; label: string }[] = [
  { code: '1', label: '普通' },
  { code: '2', label: '当座' },
  { code: '4', label: '貯蓄' },
  { code: '9', label: 'その他' },
];

/**
 * ヘッダーレコード（依頼人情報・取引設定）
 */
export interface HeaderRecord {
  typeCode: TransferType;       // 種別コード (2桁) 例: 21
  codeClassification: string;   // コード区分 (1桁) 例: 0 (JIS) または スペース
  clientCode: string;           // 委託者コード (最大10桁、半角数字)
  clientName: string;           // 委託者名 (最大40桁、半角カナ)
  transferDate: string;         // 取組日 (4桁: MMDD)
  bankCode: string;             // 仕向銀行番号 (4桁)
  bankName: string;             // 仕向銀行名 (最大15桁、半角カナ)
  branchCode: string;           // 仕向支店番号 (3桁)
  branchName: string;           // 仕向支店名 (最大15桁、半角カナ)
  accountType: '1' | '2';       // 預金種目 (1:普通, 2:当座)
  accountNumber: string;        // 口座番号 (最大7桁、数字)
}

/**
 * データレコード（個別振込先情報）
 */
export interface TransferItem {
  id: string;                   // UI用の一意キー
  bankCode: string;             // 被仕向銀行番号 (4桁)
  bankName: string;             // 被仕向銀行名 (最大15桁、半角カナ、省略可)
  branchCode: string;           // 被仕向支店番号 (3桁)
  branchName: string;           // 被仕向支店名 (最大15桁、半角カナ、省略可)
  accountType: AccountType;     // 預金種目 (1:普通, 2:当座, 4:貯蓄, 9:その他)
  accountNumber: string;        // 口座番号 (最大7桁、半角数字)
  recipientName: string;        // 受取人名 (最大30桁、半角カナ)
  amount: number;               // 振込金額 (最大10桁、整数)
  newCode?: string;             // 新規コード (0:その他, 1:第1回, 2:変更)
  customerCode1?: string;       // 顧客コード1 (最大10桁)
  customerCode2?: string;       // 顧客コード2 (最大10桁)
  ediInfo?: string;             // EDI情報 (最大20桁)
  transferDivision?: string;    // 振込区分 (通常 7: 電信振込)
  useEdi?: boolean;             // 識別表示 (Y / スペース)
}

/**
 * バリデーション結果
 */
export interface ValidationError {
  itemId?: string;              // 対象データのID（ヘッダーの場合は空）
  rowNumber?: number;           // 行番号
  field: string;                // フィールド名
  message: string;              // エラー内容
  severity: 'error' | 'warning';
}

/**
 * サマリー統計
 */
export interface TransferSummary {
  totalCount: number;
  totalAmount: number;
  hasErrors: boolean;
  errors: ValidationError[];
}
