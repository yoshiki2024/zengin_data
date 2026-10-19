import React from 'react';
import { UploadCloud, Edit3, ArrowRight, ShieldCheck, Zap, FileText } from 'lucide-react';

interface ModeSelectorProps {
  onSelectMode: (mode: 'csv' | 'manual') => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* ヒーローセクション */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ブラウザ完結型・セキュリティ安全設計</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#37352F] mb-3">
          全銀データ（総合・給与振込）作成
        </h1>
        <p className="text-sm sm:text-base text-[#787774] max-w-xl mx-auto leading-relaxed">
          経理実務者のための安全な振込データ生成ツール。会計ソフトの支払CSVや手入力から、全銀協規定フォーマット（固定長120バイト・Shift_JIS）を瞬時に書き出します。
        </p>
      </div>

      {/* 2つのモード選択カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* モード1: CSVファイルから作成 */}
        <div
          onClick={() => onSelectMode('csv')}
          className="group relative bg-white border border-[#E9E9E7] rounded-xl p-6 sm:p-8 cursor-pointer shadow-sm hover:shadow-md hover:border-[#2383E2]/60 hover:bg-[#FBFBFA] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-blue-100 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-lg font-semibold text-[#37352F] group-hover:text-blue-600 transition-colors">
                CSVファイルから作成
              </h2>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-medium rounded">
                おすすめ
              </span>
            </div>
            <p className="text-sm text-[#787774] leading-relaxed mb-6">
              会計ソフト（freee、マネーフォワード、弥生など）から出力した支払一覧CSVをドラッグ＆ドロップ。列の自動判定＆全角カナ自動正規化で素早く変換します。
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>CSVを取り込んで作成</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* モード2: 画面入力で作成 */}
        <div
          onClick={() => onSelectMode('manual')}
          className="group relative bg-white border border-[#E9E9E7] rounded-xl p-6 sm:p-8 cursor-pointer shadow-sm hover:shadow-md hover:border-[#2383E2]/60 hover:bg-[#FBFBFA] transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-amber-100 transition-transform">
              <Edit3 className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-lg font-semibold text-[#37352F] group-hover:text-amber-700 transition-colors">
                画面入力で作成
              </h2>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 font-medium rounded">
                数件〜数十件
              </span>
            </div>
            <p className="text-sm text-[#787774] leading-relaxed mb-6">
              スプレッドシート形式のフォームで、支払先・口座情報・金額を直接入力。入力支援やリアルタイムのエラーチェックにより、入力ミスを未然に防ぎます。
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-amber-700 group-hover:translate-x-1 transition-transform">
            <span>直接入力して作成</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 特徴リスト */}
      <div className="bg-white border border-[#E9E9E7] rounded-xl p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-[#37352F] mb-4 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>経理実務の安心設計ポイント</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#787774]">
          <div className="p-3 bg-[#FBFBFA] rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-800 block mb-1">🔒 完全ローカル（サーバー送信ゼロ）</span>
            口座番号や振込金額などの機密情報はブラウザ内のみで処理。外部通信は一切発生しません。
          </div>
          <div className="p-3 bg-[#FBFBFA] rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-800 block mb-1">🔤 半角カナ・英数への自動正規化</span>
            全角「カブシキガイシャ」や「１２３」は、全銀協仕様の半角カナ・英数大文字へ自動変換。
          </div>
          <div className="p-3 bg-[#FBFBFA] rounded-lg border border-gray-100">
            <span className="font-semibold text-gray-800 block mb-1">💾 Shift_JIS・CRLF自動準拠</span>
            各銀行のオンラインバンキング（BizSTATION等）が求める文字コードと120バイト固定長に完全対応。
          </div>
        </div>
      </div>
    </div>
  );
};
