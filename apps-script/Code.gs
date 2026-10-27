// スプレッドシートに1行ずつ追加する受付用プログラム
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['受付日時', '会社名', 'お名前', 'メールアドレス', 'ご相談内容', 'ご希望日時', '相談方法', '申込元', '対応状況']);
  }
  // 数式として動かないよう、先頭が = + - @ の文字には ' を付ける
  const safe = (v) => /^[=+\-@]/.test(String(v || '')) ? "'" + v : (v || '');
  sheet.appendRow([new Date(), safe(d.company), safe(d.name), safe(d.email), safe(d.message), safe(d.schedule), safe(d.method), safe(d.source), '未対応']);
  return ContentService.createTextOutput('ok');
}
