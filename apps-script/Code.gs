// スプレッドシートに1行ずつ追加し、新着をメールで知らせる受付用プログラム
const NOTIFY_TO = 'info@barkcore.co.jp';

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply('bad request');
  }
  const oneLine = (v) => String(v || '').replace(/[\r\n]+/g, ' ');
  const detail = () => [
    '会社名：' + (d.company || ''),
    'お名前：' + (d.name || ''),
    'メール：' + (d.email || ''),
    'ご希望日時：' + (d.schedule || ''),
    '相談方法：' + (d.method || ''),
    '',
    'ご相談内容：',
    (d.message || ''),
  ].join('\n');
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '') ? d.email : NOTIFY_TO;

  // 1. スプレッドシートに記録する。失敗したら、内容をそのままメールで送って失われないようにする
  let url = '';
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    url = ss.getUrl();
    const sheet = ss.getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['受付日時', '会社名', 'お名前', 'メールアドレス', 'ご相談内容', 'ご希望日時', '相談方法', '申込元', '対応状況']);
    }
    // 数式として動かないよう、先頭が = + - @ の文字には ' を付ける
    const safe = (v) => /^[=+\-@]/.test(String(v || '')) ? "'" + v : (v || '');
    sheet.appendRow([new Date(), safe(d.company), safe(d.name), safe(d.email), safe(d.message), safe(d.schedule), safe(d.method), safe(d.source), '未対応']);
  } catch (err) {
    console.error(err);
    try {
      MailApp.sendEmail({
        to: NOTIFY_TO,
        subject: '【要確認】相談フォームの保存に失敗：' + oneLine(d.name).slice(0, 40) + '様',
        body: 'スプレッドシートへの保存に失敗しました。内容は次のとおりです。\n\n' + detail() + '\n\nエラー：' + err,
        replyTo: replyTo,
      });
      return reply('ok'); // 内容はメールで届いているので、お客さんには成功と返す
    } catch (err2) {
      console.error(err2);
      return reply('error'); // どこにも残せなかった。お客さんにはメール・電話を案内する
    }
  }

  // 2. 通知メール。失敗しても、スプレッドシートへの記録は残る
  try {
    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: '【BarkCore】相談フォームに新着：' + oneLine(d.name).slice(0, 40) + '様',
      body: 'フォームから新しい相談が届きました。\n\n' + detail() + '\n\n一覧：' + url,
      replyTo: replyTo,
    });
  } catch (err) {
    console.error(err);
  }
  return reply('ok');
}

const reply = (text) => ContentService.createTextOutput(text);
