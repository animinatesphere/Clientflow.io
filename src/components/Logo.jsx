/**
 * ClientFlow mark: an envelope flap with the letter already leaving.
 * The red motion line is the same red used in the airmail rule, so the
 * logo and the send-progress device read as one system.
 */
export function LogoMark({ size = 36, reverse = false, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      role="img"
      aria-label="ClientFlow"
    >
      <rect width="44" height="44" rx="10" fill={reverse ? "#FFFFFF" : "#0E1B2A"} />
      <path
        d="M10 15.5 L22 25 L34 15.5"
        stroke={reverse ? "#0E1B2A" : "#FFFFFF"}
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 32 H29" stroke="#D0342C" strokeWidth="2.9" strokeLinecap="round" />
      <path
        d="M25.5 28.5 L29 32 L25.5 35.5"
        stroke="#D0342C"
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 32, reverse = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} reverse={reverse} />
      <span
        className="wordmark"
        style={{ fontSize: size * 0.62, color: reverse ? "#FFFFFF" : "#0E1B2A" }}
      >
        ClientFlow
      </span>
    </span>
  );
}

export default Logo;
