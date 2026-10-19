import React from 'react';
import { X, Download, FileSpreadsheet, Check } from 'lucide-react';
import { generateSampleCsvContent } from '../utils/csvParser';
import Encoding from 'encoding-japanese';

interface SampleCsvModalProps {
  onClose: () => void;
}

export const SampleCsvModal: React.FC<SampleCsvModalProps> = ({ onClose }) => {
  const downloadSample = (type: 'standard' | 'zengin_csv') => {
    const content = generateSampleCsvContent(type);
    // Shift_JIS エンコードしてダウンロード（Excelですぐ文字化けせず開けるよう）
    const unicodeArray = Encoding.stringToCode(content);
    const sjisArray = Encoding.convert(unicodeArray, {
      to: 'SJIS',
      from: 'UNICODE',
    });
    const blob = new Blob([new Uint8Array(sjisArray)], { type: 'text/csv;charset=shift_jis' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'standard' ? 'sample_payment_list.csv' : 'sample_zengin_format.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#37352F]">サンプルCSVダウンロード・仕様ガイド</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-gray-600">
          <p className="leading-relaxed">
            テストやフォーマット確認にご活用いただけるサンプルCSVをご用意しました。
          </p>

          <div className="space-y-3">
            {/* サンプル1: 一般的な支払一覧CSV */}
            <div className="p-4 rounded-lg border border-gray-200 bg-[#FBFBFA] flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 block text-xs mb-0.5">
                  ① 一般的な支払一覧CSV（推奨）
                </span>
                <span className="text-[11px] text-gray-500">
                  列名: 銀行コード, 銀行名, 支店コード, 支店名, 口座種別, 口座番号, 受取人名, 振込金額
                </span>
              </div>
              <button
                onClick={() => downloadSample('standard')}
                className="notion-btn-secondary text-xs flex items-center space-x-1 shrink-0 ml-3"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>ダウンロード</span>
              </button>
            </div>

            {/* サンプル2: 全銀協標準CSV */}
            <div className="p-4 rounded-lg border border-gray-200 bg-[#FBFBFA] flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900 block text-xs mb-0.5">
                  ② 全銀協標準CSV（ヘッダー行1、データ行2...）
                </span>
                <span className="text-[11px] text-gray-500">
                  行頭に1（ヘッダー）、2（データ）、8（トレーラ）が含まれる銀行公式CSV形式
                </span>
              </div>
              <button
                onClick={() => downloadSample('zengin_csv')}
                className="notion-btn-secondary text-xs flex items-center space-x-1 shrink-0 ml-3"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>ダウンロード</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200/50 rounded-lg space-y-1 text-blue-950">
            <span className="font-semibold block">💡 会計ソフトからの取り込みのコツ</span>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              freee、マネーフォワード、弥生会計、奉行等の「支払管理」「総合振込」から出力したCSVも、そのままドラッグ＆ドロップしていただければ自動で列を判定します。
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="notion-btn-secondary text-xs">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
