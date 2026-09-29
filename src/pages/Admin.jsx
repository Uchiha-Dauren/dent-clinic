import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
  RefreshCw,
  Download,
  LogOut,
  ShieldCheck,
  Inbox,
  Phone,
  X,
  Check,
  LoaderCircle,
  CalendarDays,
  MessageCircle,
  CheckCircle2,
  CircleSlash,
} from 'lucide-react';
import { useT } from '../i18n';
import { Logo, LanguageSwitcher } from '../components/layout/Header';
import { Button } from '../components/ui/Primitives';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { siteConfig as c } from '../config/siteConfig';
import { dateLabel } from '../lib/time';
import { formatPhone } from '../lib/phone';
import { adminJson, adminRequest } from '../api/admin';
import '../styles/admin.css';
const statuses = ['pending', 'contacted', 'confirmed', 'cancelled'];
const icons = [Inbox, MessageCircle, CheckCircle2, CircleSlash];
const pageSize = 20;
export default function Admin() {
  const { t, lang } = useT();
  const w = (key, args) => t('admin.' + key, args);
  const [session, setSession] = useState(null),
    [sessionError, setSessionError] = useState(false);
  const [key, setKey] = useState(''),
    [loggingIn, setLoggingIn] = useState(false),
    [loginError, setLoginError] = useState('');
  const [searchInput, setSearchInput] = useState(''),
    [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [date, setDate] = useState(''),
    [page, setPage] = useState(0);
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null),
    [editStatus, setEditStatus] = useState('pending'),
    [note, setNote] = useState(''),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState('');
  const [exporting, setExporting] = useState(false),
    [notice, setNotice] = useState('');
  const opener = useRef(null);
  async function checkSession() {
    setSessionError(false);
    try {
      setSession(await adminJson('/api/admin/session'));
    } catch {
      setSessionError(true);
    }
  }
  useEffect(() => {
    checkSession();
  }, []);
  useEffect(() => {
    if (!session?.authenticated) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      q,
      status,
      date,
      limit: String(pageSize),
      offset: String(page * pageSize),
    });
    adminJson('/api/bookings?' + params, { signal: controller.signal })
      .then((result) => {
        setData(result);
        if (page > 0 && page * pageSize >= result.total)
          setPage(Math.max(0, Math.ceil(result.total / pageSize) - 1));
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (error.status === 401) {
          setData(null);
          setSelected(null);
          checkSession();
        } else setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session?.authenticated, q, status, date, page, refresh]);
  useEffect(() => {
    if (!session?.authenticated) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !selected) setRefresh((n) => n + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, [session?.authenticated, selected]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  async function login(event) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      await adminJson('/api/admin/login', { method: 'POST', body: JSON.stringify({ key }) });
      setKey('');
      await checkSession();
    } catch (error) {
      setLoginError(
        error.status === 401
          ? w('wrongKey')
          : error.status === 429
            ? w('rateLimited', { seconds: error.retryAfter || 600 })
            : w('loginError'),
      );
    } finally {
      setLoggingIn(false);
    }
  }
  async function logout() {
    try {
      await adminJson('/api/admin/logout', { method: 'POST' });
      setData(null);
      setSelected(null);
      setKey('');
      await checkSession();
    } catch {
      setNotice(w('loginError'));
    }
  }
  function showRecord(row, button) {
    opener.current = button;
    setSelected(row);
    setEditStatus(row.status);
    setNote(row.admin_note || '');
    setSaveError('');
  }
  async function reloadRecord() {
    try {
      const { booking } = await adminJson('/api/bookings/' + selected.id);
      showRecord(booking, opener.current);
    } catch {
      setSaveError(w('loadError'));
    }
  }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await adminJson('/api/bookings/' + selected.id, {
        method: 'PATCH',
        body: JSON.stringify({ status: editStatus, adminNote: note, revision: selected.revision }),
      });
      setSelected(null);
      setRefresh((n) => n + 1);
      setNotice(w('saved'));
    } catch (error) {
      if (error.status === 401) {
        setSelected(null);
        setData(null);
        checkSession();
      } else setSaveError(error.status === 409 ? 'conflict' : w('saveError'));
    } finally {
      setSaving(false);
    }
  }
  async function exportCsv() {
    setExporting(true);
    try {
      const response = await adminRequest(
        '/api/bookings/export?' + new URLSearchParams({ q, status, date }),
      );
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nova-dent-bookings.csv';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setNotice(w(error.message === 'export_too_large' ? 'exportTooLarge' : 'exportError'));
    } finally {
      setExporting(false);
    }
  }
  function resetFilters() {
    setSearchInput('');
    setQ('');
    setDate('');
    setStatus('');
    setPage(0);
  }
  const serviceName = (row) =>
    row.service ? t('services.' + row.service + '.title') : w('consultation');
  const doctorName = (row) =>
    c.doctors.find((d) => d.id === row.doctor)?.name[lang] || w('anyDoctor');
  const timestamp = (value) =>
    new Intl.DateTimeFormat(lang === 'kk' ? 'kk-KZ' : 'ru-RU', {
      timeZone: c.hours.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  const filtered = !!(q || status || date),
    pages = Math.max(1, Math.ceil((data?.total || 0) / pageSize));
  return (
    <div className="admin-shell">
      <a href="#admin-content" className="skip-link">
        {w('title')}
      </a>
      <header className="admin-header container">
        <Logo />
        <span className="admin-workspace">
          <ShieldCheck size={16} />
          {w('workspace')}
        </span>
        <div className="admin-header-actions">
          <LanguageSwitcher />
          <Link to="/" className="admin-link">
            <ArrowUpRight size={17} />
            {w('home')}
          </Link>
          {session?.authenticated &&
            (session.user.mode === 'sites' ? (
              <a
                className="admin-link"
                href="/signout-with-chatgpt?return_to=%2Fadmin"
                target="_top"
              >
                <LogOut size={16} />
                {w('logout')}
              </a>
            ) : (
              <button className="admin-link" onClick={logout}>
                <LogOut size={16} />
                {w('logout')}
              </button>
            ))}
        </div>
      </header>
      <main id="admin-content" className="container admin-content">
        {!session?.authenticated ? (
          <section className="admin-login">
            <div className="admin-login-icon">
              <ShieldCheck size={28} />
            </div>
            <p className="eyebrow">NOVA DENT / {w('workspace')}</p>
            <h1>{w('loginTitle')}</h1>
            <p>{w('loginIntro')}</p>
            {sessionError ? (
              <div className="admin-error" role="alert">
                {w('sessionError')}
                <button onClick={checkSession}>{w('refresh')}</button>
              </div>
            ) : !session ? (
              <p role="status">
                <LoaderCircle size={18} className="spin" /> {t('common.loading')}
              </p>
            ) : session.loginMethod === 'chatgpt' ? (
              <>
                <Button href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top" arrow={false}>
                  {w('signInChatGPT')}
                </Button>
                <p className="admin-muted">{w('accessRestricted')}</p>
              </>
            ) : session.loginMethod === 'unconfigured' ? (
              <div className="admin-error">
                <strong>{w('notConfigured')}</strong>
                <p>{w('setupHint')}</p>
              </div>
            ) : (
              <form onSubmit={login} className="admin-login-form">
                <label htmlFor="admin-key">{w('key')}</label>
                <input
                  id="admin-key"
                  type="password"
                  autoComplete="current-password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={w('keyPlaceholder')}
                  required
                  maxLength={256}
                />
                {loginError && (
                  <p role="alert" className="admin-error">
                    {loginError}
                  </p>
                )}
                <Button
                  type="submit"
                  arrow={false}
                  loading={loggingIn}
                  disabled={loggingIn || !key.trim()}
                >
                  {w(loggingIn ? 'loggingIn' : 'login')}
                </Button>
                <p className="admin-muted">{w('localHint')}</p>
              </form>
            )}
          </section>
        ) : (
          <>
            <div className="admin-heading">
              <div>
                <p className="eyebrow">{w('workspace')}</p>
                <h1>
                  {w('title')}
                  <span>{data?.total ?? '—'}</span>
                </h1>
                <p className="admin-muted">{session.user.name}</p>
              </div>
              <div className="admin-actions">
                <button
                  className="admin-action"
                  onClick={() => setRefresh((n) => n + 1)}
                  disabled={loading}
                >
                  <RefreshCw size={17} className={loading ? 'spin' : ''} />
                  {w('refresh')}
                </button>
                <button
                  className="admin-action admin-action-primary"
                  onClick={exportCsv}
                  disabled={exporting || !data?.total}
                >
                  <Download size={17} />
                  {w(exporting ? 'exporting' : 'export')}
                </button>
              </div>
            </div>
            <div className="admin-stats">
              {statuses.map((value, i) => {
                const Icon = icons[i];
                return (
                  <button
                    key={value}
                    className={'admin-stat ' + value + (status === value ? ' is-active' : '')}
                    aria-pressed={status === value}
                    onClick={() => {
                      setStatus(status === value ? '' : value);
                      setPage(0);
                    }}
                  >
                    <span>
                      <Icon size={18} />
                      {w(value)}
                    </span>
                    <strong>{data?.counts[value] ?? '—'}</strong>
                    <ArrowUpRight size={18} />
                  </button>
                );
              })}
            </div>
            <section className="admin-list" aria-label={w('all')}>
              <form
                className="admin-filters"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQ(searchInput.trim());
                  setPage(0);
                }}
              >
                <div className="admin-search">
                  <Search size={18} />
                  <input
                    aria-label={w('search')}
                    placeholder={w('search')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    maxLength={100}
                  />
                  <button type="submit">{w('searchButton')}</button>
                </div>
                <label className="admin-date">
                  <CalendarDays size={17} />
                  <span className="sr-only">{w('date')}</span>
                  <input
                    aria-label={w('date')}
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setPage(0);
                    }}
                  />
                </label>
                {filtered && (
                  <button type="button" className="admin-reset" onClick={resetFilters}>
                    <X size={16} />
                    {w('clear')}
                  </button>
                )}
              </form>
              <div className="admin-tabs" role="group" aria-label={w('statusLabel')}>
                {['', ...statuses].map((value) => (
                  <button
                    key={value}
                    aria-pressed={status === value}
                    className={status === value ? 'is-active' : ''}
                    onClick={() => {
                      setStatus(value);
                      setPage(0);
                    }}
                  >
                    {w(value || 'all')}
                  </button>
                ))}
              </div>
              {error ? (
                <div className="admin-empty" role="alert">
                  <Inbox size={30} />
                  <h2>{w('loadError')}</h2>
                  <button className="admin-action" onClick={() => setRefresh((n) => n + 1)}>
                    {w('refresh')}
                  </button>
                </div>
              ) : loading && !data ? (
                <div className="admin-empty" role="status">
                  <LoaderCircle size={28} className="spin" />
                  <p>{w('loading')}</p>
                </div>
              ) : !data?.bookings.length ? (
                <div className="admin-empty">
                  <Inbox size={32} />
                  <h2>{w(filtered ? 'noResults' : 'emptyTitle')}</h2>
                  <p>{w(filtered ? 'noResultsText' : 'emptyText')}</p>
                  {filtered && (
                    <button className="admin-action" onClick={resetFilters}>
                      {w('clear')}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={'admin-table-wrap' + (loading ? ' is-loading' : '')}
                  aria-busy={loading}
                >
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>{w('patient')}</th>
                        <th>{w('visit')}</th>
                        <th>{w('service')}</th>
                        <th>{w('statusLabel')}</th>
                        <th>
                          <span className="sr-only">{w('details')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bookings.map((row) => (
                        <tr key={row.id}>
                          <td data-label={w('patient')}>
                            <strong>{row.name}</strong>
                            <a className="admin-phone" href={'tel:' + row.phone}>
                              {formatPhone(row.phone)}
                            </a>
                            <small>{timestamp(row.created_at)}</small>
                          </td>
                          <td data-label={w('visit')}>
                            <strong>
                              {dateLabel(row.preferred_date, lang, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </strong>
                            <span>
                              {row.preferred_time === 'any' ? w('anyTime') : row.preferred_time}
                            </span>
                          </td>
                          <td data-label={w('service')}>
                            <strong>{serviceName(row)}</strong>
                            <span>{doctorName(row)}</span>
                          </td>
                          <td data-label={w('statusLabel')}>
                            <span className={'admin-badge ' + row.status}>{w(row.status)}</span>
                            {row.admin_note && (
                              <small className="admin-note-preview">
                                <MessageCircle size={12} />
                                {row.admin_note}
                              </small>
                            )}
                          </td>
                          <td className="admin-row-action">
                            <button
                              onClick={(event) => showRecord(row, event.currentTarget)}
                              aria-label={w('details') + ': ' + row.name}
                            >
                              {w('details')}
                              <ArrowUpRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="admin-pagination">
                <span>{w('total', { count: data?.total || 0 })}</span>
                <div>
                  <button
                    aria-label={w('prev')}
                    disabled={page === 0 || loading}
                    onClick={() => setPage((n) => n - 1)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span>{w('page', { page: page + 1, pages })}</span>
                  <button
                    aria-label={w('next')}
                    disabled={page + 1 >= pages || loading}
                    onClick={() => setPage((n) => n + 1)}
                  >
                    <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </div>
              </div>
            </section>
            <p className="admin-footnote">
              {w('fresh')} · {c.hours.timezone}
            </p>
          </>
        )}
      </main>
      <Modal
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !saving) setSelected(null);
        }}
        title={w('detailsTitle')}
        description={w('detailsDescription')}
        returnFocusRef={opener}
      >
        {selected && (
          <form className="admin-record" onSubmit={save}>
            <div className="admin-record-person">
              <div>
                <h3>{selected.name}</h3>
                <p>{formatPhone(selected.phone)}</p>
              </div>
              <a className="admin-action" href={'tel:' + selected.phone}>
                <Phone size={17} />
                {w('call')}
              </a>
            </div>
            <dl className="admin-record-grid">
              <div>
                <dt>{w('visit')}</dt>
                <dd>
                  {dateLabel(selected.preferred_date, lang, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  <br />
                  {selected.preferred_time === 'any' ? w('anyTime') : selected.preferred_time}
                </dd>
              </div>
              <div>
                <dt>{w('service')}</dt>
                <dd>
                  {serviceName(selected)}
                  <br />
                  {doctorName(selected)}
                </dd>
              </div>
              <div>
                <dt>{w('received')}</dt>
                <dd>{timestamp(selected.created_at)}</dd>
              </div>
              <div>
                <dt>{w('language')}</dt>
                <dd>{selected.lang === 'kk' ? 'Қазақша' : 'Русский'}</dd>
              </div>
            </dl>
            <div className="admin-patient-comment">
              <label>{w('comment')}</label>
              <p>{selected.comment || w('noComment')}</p>
            </div>
            <div className="admin-edit-field">
              <label htmlFor="admin-status">{w('statusLabel')}</label>
              <Select
                id="admin-status"
                label={w('statusLabel')}
                value={editStatus}
                onChange={setEditStatus}
                options={statuses.map((value) => ({ value, label: w(value) }))}
              />
              <p className="admin-muted">{w('confirmHint')}</p>
            </div>
            <div className="admin-edit-field">
              <label htmlFor="admin-note">{w('note')}</label>
              <textarea
                id="admin-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={w('notePlaceholder')}
              />
              <span className="admin-muted">
                {w('noteHint')} {note.length}/1000
              </span>
            </div>
            {saveError && (
              <div className="admin-error" role="alert">
                {saveError === 'conflict' ? w('conflict') : saveError}
                {saveError === 'conflict' && (
                  <button type="button" onClick={reloadRecord}>
                    {w('reloadRecord')}
                  </button>
                )}
              </div>
            )}
            <div className="admin-record-footer">
              <small>
                {w('recordId')}: {selected.id.slice(0, 8)}
              </small>
              <Button type="submit" arrow={false} loading={saving} disabled={saving}>
                {w(saving ? 'saving' : 'save')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      {notice && (
        <div className="admin-toast" role="status">
          <Check size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label={w('close')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
