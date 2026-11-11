# Dead Ledger — Requirements

## Introduction

Dead Ledger resurrects the paper *buku kas* — the handwritten cash-and-credit
ledger book that Indonesian market stalls (*warung*) and tradespeople used for
generations to record income, expenses, and who still owes them money
(*kasbon*). That book is dead: records now scatter across chat threads and
memory, and money quietly disappears. Dead Ledger brings the book back as a
private, offline-first web app with a haunting, polished interface.

Target users: informal workers and micro-sellers (painters, tradespeople,
warung owners) who need to answer three questions at any moment: how much came
in, how much went out, and who still owes me.

## User Stories & Acceptance Criteria (EARS)

### 1. Record an entry
As a worker, I want to record money in, money out, or money owed to me, so
that nothing is trusted to memory again.

- WHEN the user submits the entry form with a type, description, a positive
  amount, and a date, THE SYSTEM SHALL save the entry and show it in the
  ledger immediately.
- WHEN the entry type is "owed" (receivable), THE SYSTEM SHALL also record
  the person's name and an optional due date.
- IF the amount is empty, zero, or negative, THEN THE SYSTEM SHALL refuse the
  entry and show a validation message.

### 2. See the whole picture at a glance
As a worker, I want a dashboard summary, so that I know where I stand without
doing mental arithmetic.

- WHEN the ledger contains entries, THE SYSTEM SHALL display total money in,
  total money out, current balance (in − out), and the total still owed by
  other people (unsettled receivables only).
- WHEN a receivable is marked settled, THE SYSTEM SHALL remove its amount
  from the "still owed" total and count it as money in.

### 3. Chase what is owed
As a worker, I want to see who owes me and mark debts settled, so that no
kasbon is forgotten.

- WHEN the user filters the ledger to "Owed", THE SYSTEM SHALL list only
  receivables, showing person, amount, and due date.
- WHEN a receivable is past its due date and unsettled, THE SYSTEM SHALL
  visually flag it as overdue.
- WHEN the user marks a receivable settled, THE SYSTEM SHALL record the
  settlement without deleting the history.

### 4. Privacy and offline use
As a worker with a cheap phone and unreliable signal, I want my book to work
offline and stay mine.

- THE SYSTEM SHALL store all data locally in the browser (localStorage) and
  SHALL NOT require an account, a server, or a network connection after the
  page has loaded.
- WHEN the page is reloaded, THE SYSTEM SHALL restore the ledger exactly as
  it was left.

### 6. The daily picture
As a worker, I want to see today's movement on its own, because the paper
book was a daily ritual: what came in today, what went out today.

- WHEN the ledger contains entries dated today (local date), THE SYSTEM
  SHALL display today's money in, today's money out, and today's net as a
  separate strip above the all-time totals' detail.
- THE SYSTEM SHALL determine "today" from the user's local calendar date,
  never from UTC.

### 7. Amount entry the way people write it
As an Indonesian user, I write amounts grouped: 300.000 means three hundred
thousand rupiah.

- WHEN the user types an amount with Indonesian thousand groupings
  (e.g. `250.000` or `1.250.000`), THE SYSTEM SHALL interpret it as the
  grouped value (250000, 1250000), not as a decimal.
- IF the amount cannot be interpreted as a positive whole number, THEN THE
  SYSTEM SHALL refuse the entry with a validation message.

### 8. Housekeeping
- WHEN the user deletes an entry and confirms, THE SYSTEM SHALL remove it
  and update all totals.
- WHEN the app is opened for the very first time, THE SYSTEM SHALL preload
  clearly-marked demo entries so the value of the app is visible in under
  ten seconds, and SHALL offer a one-tap way to clear them.
