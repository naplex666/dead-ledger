'use strict';

/* Dead Ledger — ledger core (pure functions) + browser wiring.
   The core is exported for Node so tests exercise the exact code
   the browser runs. See .kiro/specs/dead-ledger/design.md. */

const STORAGE_KEY = 'dead-ledger-entries-v1';
const SEEDED_KEY = 'dead-ledger-seeded-v1';
const ENTRY_TYPES = ['income', 'expense', 'receivable'];

/* Local calendar date as YYYY-MM-DD. Steering rule (tech.md): overdue
   checks compare against the LOCAL date, never UTC — a worker in WIB
   opening the book at 05:00 must see today's date, not yesterday's. */
function localToday(now) {
  const d = now instanceof Date ? now : new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

/* Parse a user-typed amount into integer Rupiah. Accepts plain digits
   ("250000") and Indonesian thousand groupings ("250.000", "250,000");
   a trailing ",00" decimal tail is dropped. Anything else → NaN. */
function parseAmount(raw) {
  if (typeof raw === 'number') return Math.round(raw);
  let s = String(raw == null ? '' : raw).trim().replace(/\s+/g, '');
  if (!s) return NaN;
  s = s.replace(/,00$/, ''); // "250.000,00" → "250.000"
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
  if (!/^\d+$/.test(s)) return NaN;
  return parseInt(s, 10);
}

function createEntry(input) {
  const type = input.type;
  if (!ENTRY_TYPES.includes(type)) {
    throw new Error('Unknown entry type: ' + type);
  }
  const description = String(input.description || '').trim();
  if (!description) {
    throw new Error('Description is required.');
  }
  const amount = parseAmount(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number.');
  }
  const person = String(input.person || '').trim();
  if (type === 'receivable' && !person) {
    throw new Error('A receivable needs the name of the person who owes you.');
  }
  const date = input.date || localToday();
  return {
    id: input.id || ('e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)),
    type,
    person,
    description,
    amount,
    date,
    dueDate: type === 'receivable' && input.dueDate ? input.dueDate : null,
    settled: false,
    createdAt: Date.now(),
  };
}

function computeTotals(entries) {
  let moneyIn = 0;
  let moneyOut = 0;
  let stillOwed = 0;
  for (const e of entries) {
    if (e.type === 'income') moneyIn += e.amount;
    else if (e.type === 'expense') moneyOut += e.amount;
    else if (e.type === 'receivable') {
      if (e.settled) moneyIn += e.amount;
      else stillOwed += e.amount;
    }
  }
  return { moneyIn, moneyOut, balance: moneyIn - moneyOut, stillOwed };
}

/* Totals for a single calendar day (YYYY-MM-DD): what came in, what
   went out, and the day's net. The paper book was a daily ritual —
   this is its "total harian". Settled receivables count as money in
   on their entry date, same rule as computeTotals. */
function computeDailyTotals(entries, dateStr) {
  const day = entries.filter((e) => e.date === dateStr);
  const t = computeTotals(day);
  return { moneyIn: t.moneyIn, moneyOut: t.moneyOut, net: t.moneyIn - t.moneyOut };
}

function markSettled(entries, id) {
  return entries.map((e) =>
    e.id === id && e.type === 'receivable' ? { ...e, settled: true } : e
  );
}

function filterEntries(entries, filter) {
  if (filter === 'income') return entries.filter((e) => e.type === 'income' || (e.type === 'receivable' && e.settled));
  if (filter === 'expense') return entries.filter((e) => e.type === 'expense');
  if (filter === 'owed') return entries.filter((e) => e.type === 'receivable' && !e.settled);
  return entries.slice();
}

function isOverdue(entry, today) {
  return (
    entry.type === 'receivable' &&
    !entry.settled &&
    entry.dueDate &&
    entry.dueDate < today
  );
}

function formatRupiah(n) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(Math.round(Number(n) || 0));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createEntry, computeTotals, computeDailyTotals, markSettled, filterEntries, isOverdue, formatRupiah, parseAmount, localToday, STORAGE_KEY, SEEDED_KEY };
}

/* ---------------- Browser wiring ---------------- */
if (typeof document !== 'undefined') {
  const $ = (sel) => document.querySelector(sel);

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return []; // A corrupt book must never kill the app.
    }
  }

  function saveEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function seedDemo() {
    if (localStorage.getItem(SEEDED_KEY)) return;
    const today = new Date();
    const iso = (d) => localToday(d);
    const past = (days) => { const d = new Date(today); d.setDate(d.getDate() - days); return iso(d); };
    const soon = (days) => { const d = new Date(today); d.setDate(d.getDate() + days); return iso(d); };
    const demo = [
      createEntry({ type: 'income', description: 'Painting job — Pak Budi, living room', amount: 850000, date: past(6) }),
      createEntry({ type: 'expense', description: 'Paint, rollers & tape', amount: 275000, date: past(6) }),
      createEntry({ type: 'receivable', person: 'Bu Sari (warung)', description: 'Kasbon — kitchen repaint, materials fronted', amount: 300000, date: past(3), dueDate: soon(4) }),
      createEntry({ type: 'receivable', person: 'Pak Dedi', description: 'Kasbon — fence paint, pays after harvest', amount: 500000, date: past(12), dueDate: past(2) }),
    ];
    saveEntries(demo);
    localStorage.setItem(SEEDED_KEY, '1');
  }

  let entries = [];
  let currentFilter = 'all';

  function render() {
    const totals = computeTotals(entries);
    $('#total-in').textContent = formatRupiah(totals.moneyIn);
    $('#total-out').textContent = formatRupiah(totals.moneyOut);
    $('#total-balance').textContent = formatRupiah(totals.balance);
    $('#total-owed').textContent = formatRupiah(totals.stillOwed);

    const today = localToday();
    const daily = computeDailyTotals(entries, today);
    $('#today-in').textContent = formatRupiah(daily.moneyIn);
    $('#today-out').textContent = formatRupiah(daily.moneyOut);
    $('#today-net').textContent = formatRupiah(daily.net);
    const list = filterEntries(entries, currentFilter)
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));

    const ul = $('#ledger-list');
    ul.innerHTML = '';
    if (list.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Nothing here yet. The page is blank — for now.';
      ul.appendChild(li);
      return;
    }
    for (const e of list) {
      const li = document.createElement('li');
      li.className = 'entry type-' + e.type + (e.settled ? ' settled' : '') + (isOverdue(e, today) ? ' overdue' : '');
      const badge = e.type === 'income' ? 'IN' : e.type === 'expense' ? 'OUT' : e.settled ? 'SETTLED' : 'OWED';
      const who = e.person ? `<span class="person">${escapeHtml(e.person)}</span>` : '';
      const due = e.type === 'receivable' && e.dueDate ? `<span class="due">due ${e.dueDate}${isOverdue(e, today) ? ' — OVERDUE' : ''}</span>` : '';
      li.innerHTML = `
        <div class="entry-main">
          <span class="badge">${badge}</span>
          <div>
            <div class="desc">${escapeHtml(e.description)}</div>
            <div class="meta">${e.date} ${who} ${due}</div>
          </div>
        </div>
        <div class="entry-side">
          <span class="amount">${formatRupiah(e.amount)}</span>
          <span class="actions">
            ${e.type === 'receivable' && !e.settled ? `<button data-action="settle" data-id="${e.id}">Mark paid</button>` : ''}
            <button data-action="delete" data-id="${e.id}" class="danger">Delete</button>
          </span>
        </div>`;
      ul.appendChild(li);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    seedDemo();
    entries = loadEntries();
    render();

    const typeSel = $('#f-type');
    const dueWrap = $('#due-wrap');
    typeSel.addEventListener('change', () => {
      dueWrap.style.display = typeSel.value === 'receivable' ? '' : 'none';
    });
    $('#f-date').value = localToday();

    $('#entry-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const msg = $('#form-msg');
      try {
        const entry = createEntry({
          type: typeSel.value,
          person: $('#f-person').value,
          description: $('#f-desc').value,
          amount: $('#f-amount').value,
          date: $('#f-date').value,
          dueDate: $('#f-due').value,
        });
        entries.push(entry);
        saveEntries(entries);
        ev.target.reset();
        $('#f-date').value = localToday();
        dueWrap.style.display = 'none';
        msg.textContent = 'Written into the book. It will not be forgotten.';
        msg.className = 'msg ok';
        render();
      } catch (err) {
        msg.textContent = err.message;
        msg.className = 'msg err';
      }
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
        render();
      });
    });

    $('#ledger-list').addEventListener('click', (ev) => {
      const btn = ev.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'settle') {
        entries = markSettled(entries, id);
        saveEntries(entries);
        render();
      } else if (btn.dataset.action === 'delete') {
        if (confirm('Strike this entry from the book forever?')) {
          entries = entries.filter((e) => e.id !== id);
          saveEntries(entries);
          render();
        }
      }
    });

    $('#clear-demo').addEventListener('click', () => {
      if (confirm('Clear the whole book and start from a blank page?')) {
        entries = [];
        saveEntries(entries);
        render();
      }
    });
  });
}
