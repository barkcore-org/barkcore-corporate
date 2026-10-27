// フォームの送信を受け取り、Googleスプレッドシート(Apps Script)に渡す受付係
const MAX = { name: 100, email: 200, company: 200, message: 3000, schedule: 300, method: 20, source: 50 };

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  // 迷惑投稿よけ: 隠し欄に何か入っていたら、成功したふりをして捨てる
  if (data.website) return json({ ok: true });

  const clean = {};
  for (const k of Object.keys(MAX)) {
    clean[k] = String(data[k] ?? '').trim().slice(0, MAX[k]);
  }
  if (!clean.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    return json({ ok: false }, 400);
  }
  if (!env.SHEET_WEBHOOK_URL) return json({ ok: false }, 500);

  const res = await fetch(env.SHEET_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clean),
  });
  return json({ ok: res.ok }, res.ok ? 200 : 502);
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
