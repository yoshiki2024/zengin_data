import { chromium } from 'playwright';
import path from 'path';
import Encoding from 'encoding-japanese';

const targetHtml = 'C:/Users/yoshi/OneDrive - 株式会社ユートニック/デスクトップ/Antigravity/zengin/dist/index.html';
const artifactDir = 'C:/Users/yoshi/.gemini/antigravity-ide/brain/3300f177-4220-495a-8c2b-a41b6457aa9c';

function getSjisBytes(str) {
  const codes = Encoding.stringToCode(str);
  return Encoding.convert(codes, { to: 'SJIS', from: 'UNICODE' }).length;
}

async function run() {
  console.log('--- Playwright による 120バイト固定長＆漢字自動補正の自動検証開始 ---');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  console.log('Browser: Microsoft Edge (msedge)');

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(`PageError: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`ConsoleError: ${msg.text()}`);
  });

  const fileUrl = 'file:///' + targetHtml.replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. 初期画面から「画面入力で作成」へ遷移
  console.log('Step 1: 画面入力モードへ遷移...');
  await page.locator('text=画面入力で作成').first().click();
  await page.waitForTimeout(1000);

  // 2. 自社口座情報の入力（バリデーションを通すため）
  console.log('Step 2: 自社口座情報を入力...');
  await page.locator('input[placeholder="1234567890"]').first().fill('1098810443');
  await page.locator('input[placeholder="ｶ) ｻﾝﾌﾟﾙｼｮｳｼﾞ"]').first().fill('ｶ) ﾕ-ﾄﾆﾂｸ');
  await page.locator('input[placeholder="0005"]').first().fill('0001');
  await page.locator('input[placeholder="001"]').first().fill('162');
  await page.locator('input[placeholder="1234567"]').first().fill('11919653');

  await page.waitForTimeout(500);

  // 3. 「確認画面へ進む」をクリック
  console.log('Step 3: 確認画面へ進むをクリック...');
  const proceedBtn = page.locator('button:has-text("確認画面へ進む")');
  await proceedBtn.click();
  await page.waitForTimeout(1000);

  // 4. 生データプレビュー表示
  console.log('Step 4: 120B固定長生データプレビューを表示...');
  const rawPreviewBtn = page.locator('button:has-text("120B固定長生データ"), button:has-text("通常表示")').first();
  if (await rawPreviewBtn.isVisible()) {
    await rawPreviewBtn.click();
    await page.waitForTimeout(500);
  }

  // プレビューの行要素を取得
  const lineSpans = await page.$$eval('.font-mono span', els => els.map(e => e.innerText));
  console.log('Found mono elements count:', lineSpans.length);

  const confirmShot = path.join(artifactDir, 'screenshot_confirm_valid.png');
  await page.screenshot({ path: confirmShot, fullPage: true });
  console.log('Confirm preview screenshot saved to:', confirmShot);

  // 5. 「全銀データを生成・ダウンロード」ボタンをクリック
  console.log('Step 5: エクスポートモーダルの表示確認...');
  const exportBtn = page.locator('button:has-text("全銀データを生成・ダウンロード")');
  const isEnabled = await exportBtn.isEnabled();
  console.log('Is Export Button Enabled:', isEnabled);

  if (isEnabled) {
    await exportBtn.click();
    await page.waitForTimeout(1000);

    const exportShot = path.join(artifactDir, 'screenshot_export_modal.png');
    await page.screenshot({ path: exportShot, fullPage: true });
    console.log('Export modal screenshot saved to:', exportShot);

    // モーダル内の生データプレビューテキストを取得
    const modalPre = await page.$$eval('pre', els => els.map(e => e.innerText));
    const modalText = modalPre.join('\n');
    console.log('Modal text extracted:\n', modalText);

    const lines = modalText.split(/\r?\n/).filter(line => line.trim().length > 0);
    console.log('Step 6: 各レコードの Shift_JIS バイト数を厳密検証...');
    let allValid = true;
    lines.forEach((line, idx) => {
      const bytes = getSjisBytes(line);
      console.log(`Record ${idx + 1} (Type ${line[0]}): ${bytes} bytes`);
      if (bytes !== 120) {
        console.error(`FAILED: Record ${idx + 1} has ${bytes} bytes!`);
        allValid = false;
      }
    });

    if (allValid && lines.length > 0) {
      console.log('SUCCESS: すべての行（全' + lines.length + 'レコード）が厳密に 120バイト（Shift_JIS）です！');
    }
  }

  console.log('--- 検証結果 ---');
  if (errors.length === 0) {
    console.log('SUCCESS: コンソールエラーは 0 件でした！');
  } else {
    console.error('FAILED: コンソールエラーが検出されました:');
    errors.forEach(e => console.error(' -', e));
  }

  await browser.close();
}

run().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
