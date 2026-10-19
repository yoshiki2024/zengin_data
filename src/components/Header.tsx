import React, { useState } from 'react';
import { ShieldCheck, FileSpreadsheet, RotateCcw, HelpCircle, X, CheckCircle2, Lock } from 'lucide-react';

interface HeaderProps {
  currentStep: 'select' | 'csv' | 'manual' | 'confirm';
  onReset: () => void;
  onOpenSampleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, onReset, onOpenSampleModal }) => {
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const getBreadcrumbs = () => {
    switch (currentStep) {
      case 'csv':
        return [
          { label: '全銀変換', active: false, onClick: onReset },
          { label: 'CSVインポート', active: true },
        ];
      case 'manual':
        return [
          { label: '全銀変換', active: false, onClick: onReset },
          { label: '手入力エディタ', active: true },
        ];
      case 'confirm':
        return [
          { label: '全銀変換', active: false, onClick: onReset },
          { label: '確認・出力', active: true },
        ];
      default:
        return [{ label: '全銀データ変換ツール', active: true }];
    }
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E9E9E7] px-4 sm:px-8 py-2.5 flex items-center justify-between">
        {/* 左側：パンくず・タイトル */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-sm">
            <span className="text-xl mr-1">🏦</span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-gray-300">/</span>}
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] px-1.5 py-0.5 rounded transition font-medium"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#37352F] font-semibold px-1.5 py-0.5">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <span className="hidden md:inline-flex items-center px-2 py-0.5 text-xs font-normal text-gray-500 bg-gray-100 rounded-md">
            全銀協規定フォーマット準拠
          </span>
        </div>

        {/* 右側：セキュリティバッジ & アクション */}
        <div className="flex items-center space-x-2">
          {/* セキュリティバッジ */}
          <button
            onClick={() => setShowSecurityModal(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-md transition"
            title="セキュリティ詳細を表示"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">完全ローカル処理</span>
            <span className="sm:hidden">ローカル</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          {/* サンプルCSVボタン */}
          <button
            onClick={onOpenSampleModal}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-[#787774] hover:text-[#37352F] hover:bg-[#F1F1EF] border border-[#E9E9E7] rounded-md transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">サンプルCSV</span>
          </button>

          {/* 最初に戻るボタン（ステップ進行時） */}
          {currentStep !== 'select' && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-[#787774] hover:text-red-600 hover:bg-red-50 rounded-md transition"
              title="初期画面に戻る"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">最初から</span>
            </button>
          )}
        </div>
      </header>

      {/* セキュリティモーダル */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-base text-gray-900">完全ローカル完結・セキュリティ仕様</h3>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-gray-600">
              <p className="leading-relaxed">
                本ツールは企業の機密性の高い財務データ・口座情報を扱うため、<strong className="text-gray-900 font-semibold">外部サーバーやクラウドへのデータ送信は一切行いません。</strong>
              </p>

              <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-4 space-y-2.5">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-800 text-xs leading-relaxed">
                    <strong>ブラウザ内メモリ完結:</strong> アップロードしたCSV、入力した振込先・金額等はすべてお使いのブラウザ内部（JavaScript）でのみ処理されます。
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-800 text-xs leading-relaxed">
                    <strong>オフライン動作可能:</strong> 一度ページを読み込めば、インターネット接続を切断（Wi-Fiオフ）しても全銀ファイル生成・ダウンロードが動作します。
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-gray-800 text-xs leading-relaxed">
                    <strong>依頼人設定の保持:</strong> 自社口座情報は端末のブラウザ内（localStorage）にのみ暗号化等なく保存され、外部には漏洩しません。いつでもワンクリックで消去可能です。
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowSecurityModal(false)}
                  className="notion-btn-primary"
                >
                  確認しました
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
