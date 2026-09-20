/* ===== ใส่ค่าจาก Supabase → Project Settings → API ===== */
const SB_URL = 'https://rcghrysjzggtyfhqqqxr.supabase.co';
const SB_KEY = 'sb_publishable_x0yhinoAkKnsFxy34vNNIw__KufBHQb';
/* ======================================================= */

const sb = supabase.createClient(SB_URL, SB_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});

/* ---------- ฟังก์ชันใช้ร่วมกัน ---------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const THAI_M = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const THAI_D = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

function thDate(s){
  if(!s) return '-';
  const d = new Date(s + 'T00:00:00');
  return `${d.getDate()} ${THAI_M[d.getMonth()]} ${d.getFullYear()+543} (${THAI_D[d.getDay()]})`;
}
function mDT(m){
  const [h,mi] = (m.match_time||'00:00').split(':');
  const d = new Date(m.match_date + 'T00:00:00');
  d.setHours(+h||0, +mi||0, 0, 0);
  return d;
}
/* คำนวณตารางคะแนนจากผลแมตช์ */
function standings(sport, teams, matches){
  const T = {};
  teams.forEach(t => T[t.id] = {id:t.id, n:t.name, yr:t.year_group,
    w:0, d:0, l:0, gf:0, ga:0});
  matches.filter(m => m.status === 'done' && m.score_a != null && m.score_b != null)
    .forEach(m => {
      const A = T[m.team_a], B = T[m.team_b];
      if(!A || !B) return;
      A.gf += m.score_a; A.ga += m.score_b;
      B.gf += m.score_b; B.ga += m.score_a;
      if(m.score_a > m.score_b){ A.w++; B.l++; }
      else if(m.score_a < m.score_b){ B.w++; A.l++; }
      else { A.d++; B.d++; }
    });
  return Object.values(T).map(t => ({
    ...t,
    pl: t.w + t.d + t.l,
    df: t.gf - t.ga,
    pt: t.w*sport.win_pt + t.d*sport.draw_pt + t.l*sport.lose_pt
  })).sort((a,b) => b.pt-a.pt || b.df-a.df || b.gf-a.gf || a.n.localeCompare(b.n,'th'));
}