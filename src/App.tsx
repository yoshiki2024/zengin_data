import React, { useState } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { CsvFlow } from './components/CsvFlow';
import { ManualFlow } from './components/ManualFlow';
import { ConfirmSummary } from './components/ConfirmSummary';
import { ExportModal } from './components/ExportModal';
import { SampleCsvModal } from './components/SampleCsvModal';
import { HeaderRecord, TransferItem } from './types/zengin';
import { loadSavedHeader } from './utils/storage';
import { ShieldCheck, Heart } from 'lucide-react';

export function App() {
  const [currentStep, setCurrentStep] = useState<'select' | 'csv' | 'manual' | 'confirm'>('select');
  const [header, setHeader] = useState<HeaderRecord>(() => loadSavedHeader());
  const [items, setItems] = useState<TransferItem[]>([]);
  const [previousStep, setPreviousStep] = useState<'csv' | 'manual'>('csv');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  // モード選択
  const handleSelectMode = (mode: 'csv' | 'manual') => {
    setCurrentStep(mode);
  };

  // 確認画面へ進む
  const handleProceedToConfirm = (newItems: TransferItem[]) => {
    setItems(newItems);
    if (currentStep === 'csv' || currentStep === 'manual') {
      setPreviousStep(currentStep);
    }
    setCurrentStep('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 確認画面から編集へ戻る
  const handleBackToEdit = () => {
    setCurrentStep(previousStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 最初に戻る
  const handleReset = () => {
    if (items.length > 0) {
      if (!window.confirm('入力途中のデータはリセットされます。初期画面に戻りますか？')) {
        return;
      }
    }
    setItems([]);
    setCurrentStep('select');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#37352F]">
      {/* トップナビゲーション */}
      <Header
        currentStep={currentStep}
        onReset={handleReset}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
      />

      {/* メインビュー */}
      <main className="flex-1">
        {currentStep === 'select' && (
          <ModeSelector onSelectMode={handleSelectMode} />
        )}

        {currentStep === 'csv' && (
          <CsvFlow
            header={header}
            onHeaderChange={setHeader}
            onProceedToConfirm={handleProceedToConfirm}
            onCancel={() => setCurrentStep('select')}
          />
        )}

        {currentStep === 'manual' && (
          <ManualFlow
            header={header}
            onHeaderChange={setHeader}
            onProceedToConfirm={handleProceedToConfirm}
            onCancel={() => setCurrentStep('select')}
          />
        )}

        {currentStep === 'confirm' && (
          <ConfirmSummary
            header={header}
            items={items}
            onBack={handleBackToEdit}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

      {/* エクスポート（ダウンロード）モーダル */}
      {isExportModalOpen && (
        <ExportModal
          header={header}
          items={items}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* サンプルCSVモーダル */}
      {isSampleModalOpen && (
        <SampleCsvModal
          onClose={() => setIsSampleModalOpen(false)}
        />
      )}

      {/* フッター */}
      <footer className="border-t border-[#E9E9E7] py-6 px-4 bg-white/60 text-center text-xs text-[#787774]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>完全ローカル処理（クライアント側JavaScript実行）/ 外部通信一切なし</span>
          </div>

          <div className="text-[11px] text-gray-400">
            全国銀行協会（全銀協）規定フォーマット準拠（120バイト固定長・Shift_JIS・CRLF）
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
