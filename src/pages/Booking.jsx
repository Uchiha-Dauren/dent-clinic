import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion, useAnimationControls } from 'motion/react';
import {
  ArrowLeft,
  CalendarDays,
  ShieldCheck,
  Phone,
  MessageCircle,
  Check,
  LockKeyhole,
  AlertCircle,
} from 'lucide-react';
import { siteConfig as c } from '../config/siteConfig';
import { useT } from '../i18n';
import { Button, SpotlightCard, SparkleField } from '../components/ui/Primitives';
import { ContactDock } from '../components/layout/ContactDock';
import { Hours, OpenStatus } from '../components/layout/Header';
import Select from '../components/ui/Select';
import { formatPhone, normalizePhone, caretForDigits } from '../lib/phone';
import { zonedNow, addDays, dateLabel } from '../lib/time';
import { generateSlots, isAvailableDate } from '../lib/slots';
import { validateBooking, tidyName } from '../lib/validation';
import { downloadIcs } from '../lib/ics';
import { submitBooking, isMockMode } from '../api/booking';
import { useSessionState } from '../hooks/useSessionState';
function ErrorText({ name, errors }) {
  const { t } = useT();
  return errors[name] ? (
    <p className="field-error" id={name + '-error'}>
      <AlertCircle size={13} />
      {t('validation.' + errors[name])}
    </p>
  ) : null;
}
function PhoneInput({ value, onChange, onBlur, error }) {
  const { t } = useT(),
    ref = useRef(null),
    caret = useRef(null);
  useLayoutEffect(() => {
    if (caret.current !== null && ref.current) {
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [value]);
  function change(e) {
    const raw = e.target.value;
    const pos = e.target.selectionStart ?? raw.length;
    let count = raw.slice(0, pos).replace(/\D/g, '').length;
    const next = formatPhone(raw);
    if (!raw.trim().startsWith('+7') && raw.replace(/\D/g, '').length <= 10) count++;
    caret.current = caretForDigits(next, count);
    onChange(next);
    if (next === value && ref.current) ref.current.setSelectionRange(caret.current, caret.current);
  }
  function remove(e) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    const input = e.currentTarget,
      start = input.selectionStart,
      end = input.selectionEnd;
    if (start !== end) return;
    const index = e.key === 'Backspace' ? start - 1 : start;
    if (index >= 0 && index < value.length && !/\d/.test(value[index])) {
      e.preventDefault();
      let digit = index;
      while (digit >= 0 && digit < value.length && !/\d/.test(value[digit]))
        digit += e.key === 'Backspace' ? -1 : 1;
      if (digit < 3) return;
      const raw = value.slice(0, digit) + value.slice(digit + 1);
      const count = value.slice(0, digit).replace(/\D/g, '').length;
      const next = formatPhone(raw);
      caret.current = caretForDigits(next, count);
      onChange(next);
    }
  }
  return (
    <input
      ref={ref}
      id="phone"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+7 (___) ___-__-__"
      value={value}
      onChange={change}
      onKeyDown={remove}
      onBlur={onBlur}
      aria-invalid={!!error}
      aria-describedby={error ? 'phone-error' : undefined}
      aria-label={t('booking.phone')}
      required
    />
  );
}
export default function Booking() {
  const { t, lang } = useT(),
    [params] = useSearchParams();
  const reduced = useReducedMotion();
  const shake = useAnimationControls();
  const [draftName, setDraftName] = useSessionState('nova-booking-name', ''),
    [draftPhone, setDraftPhone] = useSessionState('nova-booking-phone', '');
  const [clock, setClock] = useState(() => new Date());
  const today = zonedNow(clock).date;
  const [values, setValues] = useState(() => ({
    name: draftName,
    phone: draftPhone,
    date: today,
    time: 'any',
    service: c.services.some((s) => s.id === params.get('service')) ? params.get('service') : '',
    doctor: c.doctors.some((d) => d.id === params.get('doctor')) ? params.get('doctor') : '',
    comment: '',
    consent: false,
    website: '',
  }));
  const [errors, setErrors] = useState({}),
    [pending, setPending] = useState(false),
    [failure, setFailure] = useState(false),
    [success, setSuccess] = useState(null),
    [otherDate, setOtherDate] = useState(false),
    [cooldown, setCooldown] = useState(0),
    [attempt, setAttempt] = useState(0);
  const retryAt = useRef(0),
    formRef = useRef(null),
    successRef = useRef(null);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i)),
    slots = generateSlots(values.date, clock);
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date());
      setCooldown(Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);
  useEffect(() => {
    if (attempt && !reduced) shake.start({ x: [0, -4, 4, -2, 0], transition: { duration: 0.3 } });
  }, [attempt, reduced, shake]);
  function update(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
    if (key === 'name') setDraftName(value);
    if (key === 'phone') setDraftPhone(value);
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFailure(false);
  }
  function blur(key) {
    let next = values;
    if (key === 'name') {
      const name = tidyName(values.name);
      update('name', name);
      next = { ...values, name };
    }
    const error = validateBooking(next)[key];
    setErrors((e) => ({ ...e, [key]: error }));
  }
  useEffect(() => {
    const ctx = document.modelContext;
    if (!ctx?.registerTool) return;
    const controller = new AbortController();
    const tool = {
      name: 'get_booking_slots',
      title: 'Available preferred appointment times',
      description:
        'Read clinic-local dates and preferred appointment times. These are requests, not confirmed availability.',
      inputSchema: {
        type: 'object',
        properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
        required: ['date'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (!input || !isAvailableDate(input.date))
          throw new Error('Date unavailable or outside booking range');
        return {
          date: input.date,
          timezone: c.hours.timezone,
          slots: generateSlots(input.date)
            .filter((s) => !s.disabled)
            .map((s) => s.time),
          callback: true,
        };
      },
    };
    try {
      Promise.resolve(ctx.registerTool(tool, { signal: controller.signal })).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, []);
  async function submit(e) {
    e?.preventDefault();
    if (pending) return;
    const checked = validateBooking(values);
    setErrors(checked);
    if (Object.values(checked).some(Boolean)) {
      setAttempt((a) => a + 1);
      const first = [
        'name',
        'phone',
        'date',
        'time',
        'service',
        'doctor',
        'comment',
        'consent',
      ].find((k) => checked[k]);
      requestAnimationFrame(() => {
        const el = document.getElementById(first);
        el?.focus();
        el?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
      });
      return;
    }
    const remaining = Math.ceil((retryAt.current - Date.now()) / 1000);
    if (remaining > 0) {
      setCooldown(remaining);
      return;
    }
    retryAt.current = Date.now() + 10000;
    setCooldown(10);
    setPending(true);
    setFailure(false);
    const payload = {
      name: tidyName(values.name),
      phone: normalizePhone(values.phone),
      date: values.date,
      time: values.time,
      service: values.service || null,
      doctor: values.doctor || null,
      comment: values.comment.trim(),
      consent: true,
      lang,
      source: 'website',
      website: values.website,
    };
    try {
      const result = await submitBooking(payload);
      setSuccess({ ...payload, id: result.id, mock: !!result.mock });
      setDraftName('');
      setDraftPhone('');
    } catch (error) {
      if (error.fields) setErrors(error.fields);
      if (error.retryAfter) {
        retryAt.current = Date.now() + error.retryAfter * 1000;
        setCooldown(error.retryAfter);
      }
      setFailure(true);
    } finally {
      setPending(false);
    }
  }
  const benefits = [ShieldCheck, Phone, MessageCircle];
  return (
    <div className="container booking-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} />
        {t('common.home')}
      </Link>
      <div className="booking-layout">
        <SpotlightCard className="booking-aside">
          <SparkleField />
          <p className="eyebrow">{t('booking.eyebrow')}</p>
          <h1>{t('booking.title')}</h1>
          <p className="booking-subtitle">
            {t('booking.subtitle', { minutes: c.responseMinutes })}
          </p>
          <div className="booking-benefits">
            {t('booking.benefits').map((x, i) => {
              const Icon = benefits[i];
              return (
                <div key={x}>
                  <span>
                    <Icon size={18} />
                  </span>
                  {x}
                </div>
              );
            })}
          </div>
          <div className="booking-aside-bottom">
            <ContactDock />
            <Hours />
            <OpenStatus />
          </div>
          <span className="aside-star" aria-hidden="true">
            ✦
          </span>
        </SpotlightCard>
        <motion.div
          className="booking-form-card"
          animate={shake}
          key={'form' + (success ? 'success' : 'entry')}
          transition={{ duration: 0.3 }}
        >
          {success ? (
            <motion.div
              ref={successRef}
              tabIndex={-1}
              className="success-state"
              initial={reduced ? false : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="success-icon">
                <motion.svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <motion.path
                    d="m12 24 8 8 16-17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={reduced ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.svg>
                {!reduced &&
                  Array.from({ length: 10 }, (_, i) => (
                    <motion.span
                      aria-hidden="true"
                      key={i}
                      className="success-sparkle"
                      initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
                      animate={{
                        opacity: 0,
                        x: Math.cos((i * Math.PI) / 5) * 100,
                        y: Math.sin((i * Math.PI) / 5) * 100,
                        scale: 1,
                      }}
                      transition={{ duration: 1.5 }}
                    >
                      ✦
                    </motion.span>
                  ))}
              </div>
              <h2>{t(success.mock ? 'booking.successDemo' : 'booking.success')}</h2>
              <p>
                {t(success.mock ? 'booking.successDemoText' : 'booking.successText', {
                  minutes: c.responseMinutes,
                })}
              </p>
              <dl className="booking-summary">
                <div>
                  <dt>{t('booking.name')}</dt>
                  <dd>{success.name}</dd>
                </div>
                <div>
                  <dt>{t('booking.phone')}</dt>
                  <dd>{formatPhone(success.phone)}</dd>
                </div>
                <div>
                  <dt>{t('booking.date')}</dt>
                  <dd>
                    {dateLabel(success.date, lang, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
                <div>
                  <dt>{t('booking.time')}</dt>
                  <dd>{success.time === 'any' ? t('booking.any') : success.time}</dd>
                </div>
                <div>
                  <dt>{t('booking.service')}</dt>
                  <dd>
                    {success.service
                      ? t('services.' + success.service + '.title')
                      : t('booking.unknown')}
                  </dd>
                </div>
              </dl>
              {success.time !== 'any' && (
                <>
                  <Button
                    className="full-width"
                    onClick={() =>
                      downloadIcs(success, {
                        title: t('booking.calendarTitle', { clinic: c.brand.name }),
                        description: t('booking.calendarDescription'),
                        location: c.address[lang],
                      })
                    }
                  >
                    <CalendarDays size={17} />
                    {t('booking.calendar')}
                  </Button>
                  <p className="calendar-note">{t('booking.calendarNote')}</p>
                </>
              )}
              <Button
                href={c.contacts.telegram}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                className="full-width"
              >
                {t('booking.telegram')}
              </Button>
              <Button to="/" variant="ghost">
                {t('common.home')}
              </Button>
            </motion.div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate>
              <div className="form-heading">
                <span className="eyebrow">{t('booking.step')}</span>
                <h2>{t('booking.heading')}</h2>
                <p>{t('booking.intro')}</p>
              </div>
              <div className="contact-fields">
                <div className="field">
                  <label htmlFor="name">
                    {t('booking.name')} <span>*</span>
                  </label>
                  <input
                    id="name"
                    autoComplete="name"
                    placeholder={t('booking.namePlaceholder')}
                    value={values.name}
                    onChange={(e) => update('name', e.target.value)}
                    onBlur={() => blur('name')}
                    maxLength={60}
                    required
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  <ErrorText name="name" errors={errors} />
                </div>
                <div className="field">
                  <label htmlFor="phone">
                    {t('booking.phone')} <span>*</span>
                  </label>
                  <PhoneInput
                    value={values.phone}
                    onChange={(v) => update('phone', v)}
                    onBlur={() => blur('phone')}
                    error={errors.phone}
                  />
                  <ErrorText name="phone" errors={errors} />
                </div>
              </div>
              <fieldset className="date-field">
                <legend>
                  {t('booking.date')} <span>*</span>
                </legend>
                <div
                  className="date-strip"
                  role="group"
                  aria-label={t('booking.date')}
                  tabIndex={-1}
                  id="date"
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                >
                  {dates.map((d, i) => (
                    <button
                      type="button"
                      key={d}
                      className="date-chip"
                      disabled={!isAvailableDate(d, clock)}
                      aria-pressed={values.date === d}
                      aria-label={dateLabel(d, lang, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                      onClick={() => {
                        update('date', d);
                        update('time', 'any');
                      }}
                    >
                      <span>
                        {i === 0 ? t('booking.today') : dateLabel(d, lang, { weekday: 'short' })}
                      </span>
                      <strong>{d.slice(8)}</strong>
                      <small>{dateLabel(d, lang, { month: 'short' })}</small>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="other-date"
                  onClick={() => setOtherDate((v) => !v)}
                  aria-expanded={otherDate}
                >
                  <CalendarDays size={15} />
                  {t('booking.otherDate')}
                </button>
                {otherDate && (
                  <input
                    className="native-date"
                    type="date"
                    aria-label={t('booking.otherDate')}
                    min={today}
                    max={addDays(today, 60)}
                    value={values.date}
                    onChange={(e) => {
                      update('date', e.target.value);
                      update('time', 'any');
                    }}
                    onBlur={() => blur('date')}
                  />
                )}
                <ErrorText name="date" errors={errors} />
              </fieldset>
              <fieldset className="time-field">
                <legend>
                  {t('booking.time')} <span>*</span>
                </legend>
                <div
                  id="time"
                  tabIndex={-1}
                  aria-invalid={!!errors.time}
                  aria-describedby={errors.time ? 'time-error' : undefined}
                >
                  <div className="time-grid">
                    {slots.map((s) => (
                      <button
                        type="button"
                        key={s.time}
                        className="time-chip"
                        disabled={s.disabled}
                        aria-pressed={values.time === s.time}
                        onClick={() => update('time', s.time)}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                  {!slots.length ? (
                    <p className="slot-note">{t('booking.unavailable')}</p>
                  ) : slots.every((s) => s.disabled) ? (
                    <p className="slot-note">{t('booking.noTimes')}</p>
                  ) : null}
                  <button
                    type="button"
                    className="any-time"
                    aria-pressed={values.time === 'any'}
                    onClick={() => update('time', 'any')}
                  >
                    <span className="radio-dot" />
                    {t('booking.any')}
                  </button>
                </div>
                <ErrorText name="time" errors={errors} />
              </fieldset>
              <div className="select-fields">
                <div className="field">
                  <label htmlFor="service">
                    {t('booking.service')} <small>{t('booking.optional')}</small>
                  </label>
                  <Select
                    id="service"
                    label={t('booking.service')}
                    value={values.service}
                    onChange={(v) => update('service', v)}
                    invalid={errors.service}
                    describedBy={errors.service ? 'service-error' : undefined}
                    options={[
                      { value: '', label: t('booking.unknown') },
                      ...c.services.map((s) => ({
                        value: s.id,
                        label: t('services.' + s.id + '.title'),
                      })),
                    ]}
                  />
                  <ErrorText name="service" errors={errors} />
                </div>
                <div className="field">
                  <label htmlFor="doctor">
                    {t('booking.doctor')} <small>{t('booking.optional')}</small>
                  </label>
                  <Select
                    id="doctor"
                    label={t('booking.doctor')}
                    value={values.doctor}
                    onChange={(v) => update('doctor', v)}
                    invalid={errors.doctor}
                    describedBy={errors.doctor ? 'doctor-error' : undefined}
                    options={[
                      { value: '', label: t('booking.anyDoctor') },
                      ...c.doctors.map((d) => ({ value: d.id, label: d.name[lang] })),
                    ]}
                  />
                  <ErrorText name="doctor" errors={errors} />
                </div>
              </div>
              <div className="field comment-field">
                <label htmlFor="comment">
                  {t('booking.comment')} <small>{t('booking.optional')}</small>
                </label>
                <textarea
                  id="comment"
                  placeholder={t('booking.commentPlaceholder')}
                  value={values.comment}
                  onChange={(e) => update('comment', e.target.value)}
                  onBlur={() => blur('comment')}
                  rows={3}
                  maxLength={300}
                  aria-describedby="comment-count"
                  aria-invalid={!!errors.comment}
                />
                <span id="comment-count" className="comment-count">
                  {values.comment.length}/300
                </span>
                <ErrorText name="comment" errors={errors} />
              </div>
              <div className="consent-field">
                <label htmlFor="consent">
                  <input
                    id="consent"
                    type="checkbox"
                    checked={values.consent}
                    onChange={(e) => update('consent', e.target.checked)}
                    onBlur={() => blur('consent')}
                    required
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'consent-error' : undefined}
                  />
                  <span>
                    {t('booking.consent')}{' '}
                    <Link to="/privacy" target="_blank" aria-label={t('footer.privacy')}>
                      ↗
                    </Link>
                  </span>
                </label>
                <ErrorText name="consent" errors={errors} />
              </div>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="website">
                  Website
                  <input
                    id="website"
                    name="website"
                    autoComplete="off"
                    tabIndex={-1}
                    value={values.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                </label>
              </div>
              {errors.website && <p className="field-error">{t('validation.spam')}</p>}
              {failure && (
                <div className="submit-error" role="alert">
                  <AlertCircle size={19} />
                  <p>{t('booking.error')}</p>
                  <div>
                    <a href={`tel:${c.contacts.phone}`}>{t('contacts.call')}</a>
                    <a href={c.contacts.whatsapp} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                    <a href={c.contacts.telegram} target="_blank" rel="noopener noreferrer">
                      Telegram
                    </a>
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="full-width submit-button"
                loading={pending}
                disabled={pending || cooldown > 0}
                magnetic
              >
                {t(pending ? 'booking.submitting' : failure ? 'booking.retry' : 'booking.submit')}
              </Button>
              {cooldown > 0 && !pending && (
                <p className="cooldown" role="status">
                  {t('booking.cooldown', { seconds: cooldown })}
                </p>
              )}
              <p className="privacy-note">
                <LockKeyhole size={12} />
                {t('booking.privacyNote')}
              </p>
              {isMockMode && <p className="mock-notice">{t('booking.demo')}</p>}
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
