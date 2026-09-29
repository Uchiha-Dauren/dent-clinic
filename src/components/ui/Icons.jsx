export function ToothMark({ size = 36, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" {...props}>
      <path
        d="M19 8c-6-4-13-1-12 7 1 6 4 18 8 18 3 0 1-11 5-11s2 11 5 11c4 0 7-12 8-18 .3-3-1-5-3-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="m28 2 1.7 5.3L35 9l-5.3 1.7L28 16l-1.7-5.3L21 9l5.3-1.7Z" fill="currentColor" />
    </svg>
  );
}
export function SocialIcon({ name, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      {...props}
    >
      {name === 'instagram' ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
        </>
      ) : name === 'telegram' ? (
        <>
          <path d="m3 10 18-7-4 18-6-6-4 3 1-6Z" strokeLinejoin="round" />
          <path d="m8 12 9-5-6 8" />
        </>
      ) : name === 'whatsapp' ? (
        <>
          <path d="m4 17-1 4 5-1a9 9 0 1 0-4-3Z" />
          <path d="M8 7c-1 1 0 5 3 7s5 2 6 0l-3-2-1 1-3-3 1-1-2-2Z" />
        </>
      ) : (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
    </svg>
  );
}
export function ServiceIcon({ name }) {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      {name === 'implant' ? (
        <>
          <path d="M9 4h14v8H9zM12 12l2 17h4l2-17M10 17l12-3M11 22l10-3M12 27l8-3" />
        </>
      ) : name === 'braces' ? (
        <>
          <path d="M3 11q13-9 26 0v11Q16 31 3 22Z" />
          <path d="M3 17h26M9 7v19M16 5v23M23 7v19" />
          <path d="M7 14h4v6H7zM14 14h4v6h-4zM21 14h4v6h-4z" fill="white" />
        </>
      ) : name === 'crown' ? (
        <>
          <path d="m5 12 3 15h16l3-15-7 5-4-10-4 10Z" />
          <path d="M9 23h14" />
          <circle cx="5" cy="10" r="2" />
          <circle cx="16" cy="5" r="2" />
          <circle cx="27" cy="10" r="2" />
        </>
      ) : (
        <>
          <path d="M15 6C8 2 3 7 6 15c2 5 3 13 6 13s1-9 4-9 1 9 4 9 4-8 6-13c2-7-1-11-6-10" />
          {name === 'sparkle' ? (
            <path d="m24 1 1.5 4.5L30 7l-4.5 1.5L24 13l-1.5-4.5L18 7l4.5-1.5Z" />
          ) : (
            <path d="m11 10 2 3 5-1" />
          )}
        </>
      )}
    </svg>
  );
}
