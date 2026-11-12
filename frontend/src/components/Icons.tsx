import type { SVGProps } from "react";

export function WaitFeedMark({ className = "w-7 h-7", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 96 96"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="96" height="96" rx="14" fill="#141414" />
      <path
        d="M20 18H76A28 28 0 0 1 20 18ZM48 50L48 50A28 28 0 0 1 69.45 60L26.55 60A28 28 0 0 1 48 50ZM24.05 63.5L71.95 63.5A28 28 0 0 1 74.15 68L21.85 68A28 28 0 0 1 24.05 63.5ZM20.76 71.5L75.24 71.5A28 28 0 0 1 76 78L20 78A28 28 0 0 1 20.76 71.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function WaitFeedMarkInverted({ className = "w-7 h-7", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 96 96"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="96" height="96" rx="14" fill="#FFFFFF" />
      <path
        d="M20 18H76A28 28 0 0 1 20 18ZM48 50L48 50A28 28 0 0 1 69.45 60L26.55 60A28 28 0 0 1 48 50ZM24.05 63.5L71.95 63.5A28 28 0 0 1 74.15 68L21.85 68A28 28 0 0 1 24.05 63.5ZM20.76 71.5L75.24 71.5A28 28 0 0 1 76 78L20 78A28 28 0 0 1 20.76 71.5Z"
        fill="#141414"
      />
    </svg>
  );
}

export function WaitFeedBrand({
  className = "",
  markClassName = "w-7 h-7",
  textClassName = "text-[22px]",
  text,
  isDark = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  text?: string;
  isDark?: boolean;
}) {
  return (
    <div className={`flex items-end gap-1 sm:gap-1.5 select-none ${className}`}>
      <WaitFeedMark className={`${markClassName} shrink-0`} />
      <span
        className={`font-logo ${textClassName} leading-none translate-y-px`}
      >
        {text && text !== "waitfeed" ? (
          text
        ) : (
          <>
            <span
              className={`italic font-medium tracking-[-0.035em] ${
                isDark ? "text-[#A8A596]" : "text-[#807D6E]"
              }`}
            >
              wait
            </span>
            <span
              className={`relative inline-block not-italic font-bold tracking-[-0.035em] ml-0.5 ${
                isDark ? "text-white" : "text-[#191918]"
              }`}
            >
              feed
              <svg
                viewBox="0 0 100 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-2px",
                  bottom: "-5px",
                  width: "calc(100% + 5px)",
                  height: "6px",
                  overflow: "visible",
                  pointerEvents: "none",
                  opacity: 1,
                  transform: "none",
                  transition: "none",
                }}
              >
                <path
                  d="M 1 9.5 C 25 3.5, 60 1.5, 99 4 C 65 5.5, 30 7.5, 1 9.5 Z"
                  fill="#fcaa2d"
                />
              </svg>
            </span>
          </>
        )}
      </span>
    </div>
  );
}

export const WaitFeedLogo = WaitFeedBrand;
export const RelaceLogo = WaitFeedBrand;
export const RelaceEmblem = WaitFeedMark;

export function BrainIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(0.997 2)">
        <path
          d="M 2.5 0 C 2.994 0 3.478 0.147 3.889 0.421 C 4.3 0.696 4.62 1.086 4.81 1.543 C 4.999 2 5.048 2.503 4.952 2.988 C 4.855 3.473 4.617 3.918 4.268 4.268 C 3.918 4.617 3.473 4.855 2.988 4.952 C 2.503 5.048 2 4.999 1.543 4.81 C 1.086 4.62 0.696 4.3 0.421 3.889 C 0.147 3.478 0 2.994 0 2.5 L 0 2.079"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(2.003 6.5)"
        />
        <path
          d="M 2.5 0 C 2.006 0 1.522 0.147 1.111 0.421 C 0.7 0.696 0.38 1.086 0.19 1.543 C 0.001 2 -0.048 2.503 0.048 2.988 C 0.145 3.473 0.383 3.918 0.732 4.268 C 1.082 4.617 1.527 4.855 2.012 4.952 C 2.497 5.048 3 4.999 3.457 4.81 C 3.914 4.62 4.304 4.3 4.579 3.889 C 4.853 3.478 5 2.994 5 2.5 L 5 2.079"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(7.003 6.5)"
        />
        <path
          d="M 3.503 8.75 L 3.003 8.75 C 2.295 8.751 1.609 8.501 1.067 8.044 C 0.526 7.588 0.163 6.955 0.043 6.257 C -0.077 5.559 0.055 4.841 0.413 4.231 C 0.772 3.62 1.335 3.156 2.003 2.921 L 2.003 2.5 C 2.003 1.837 2.266 1.201 2.735 0.732 C 3.204 0.263 3.84 0 4.503 0 C 5.166 0 5.802 0.263 6.27 0.732 C 6.739 1.201 7.003 1.837 7.003 2.5 L 7.003 9"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 3.5 8.75 L 4 8.75 C 4.708 8.751 5.394 8.501 5.935 8.044 C 6.477 7.588 6.84 6.955 6.959 6.257 C 7.079 5.559 6.948 4.841 6.59 4.231 C 6.231 3.62 5.668 3.156 5 2.921 L 5 2.5 C 5 1.837 4.737 1.201 4.268 0.732 C 3.799 0.263 3.163 0 2.5 0 C 1.837 0 1.201 0.263 0.732 0.732 C 0.263 1.201 0 1.837 0 2.5"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(7.003 0)"
        />
        <path
          d="M 2 2 L 1.75 2 C 1.286 2 0.841 1.816 0.513 1.487 C 0.184 1.159 0 0.714 0 0.25 L 0 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(9.503 3)"
        />
        <path
          d="M 0 2 L 0.25 2 C 0.714 2 1.159 1.816 1.487 1.487 C 1.816 1.159 2 0.714 2 0.25 L 2 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(2.503 3)"
        />
      </g>
    </svg>
  );
}

export function RadarIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(2 2)">
        <path
          d="M 5 10 C 7.761 10 10 7.761 10 5 C 10 2.239 7.761 0 5 0 C 2.239 0 0 2.239 0 5 C 0 7.761 2.239 10 5 10 Z"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 0 0 L 3.464 3.464"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(8.536 8.536)"
        />
      </g>
    </svg>
  );
}

export function BranchIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(4.5 2.5)">
        <path
          d="M 3.5 12 L 3.5 7.5 L 0 4 L 0 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 4 0 L 2 2 L 0 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(1.5 10)"
        />
        <path
          d="M 3.5 0 L 3.5 4 L 0 7.5"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(3.5 0)"
        />
      </g>
    </svg>
  );
}

export function GaugeIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M 7 0 L 6 5 L 10 6.5 L 3 14 L 4 9 L 0 7.5 Z"
        stroke="currentColor"
        strokeWidth="0.63"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(3 1)"
      />
    </svg>
  );
}

export function PlugIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(2 1.5)">
        <path
          d="M 0 2.5 L 2.5 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(7 0)"
        />
        <path
          d="M 2.5 0 L 0 2.5"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(10 3)"
        />
        <path
          d="M 7 7 L 0 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(5 0.5)"
        />
        <path
          d="M 9.75 5.5 L 6.086 9.164 C 5.711 9.539 5.202 9.75 4.672 9.75 C 4.141 9.75 3.633 9.539 3.257 9.164 L 0.586 6.492 C 0.211 6.117 0 5.609 0 5.078 C 0 4.548 0.211 4.039 0.586 3.664 L 4.25 0"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(1.5 1.25)"
        />
        <path
          d="M 3.422 0 L 0 3.422"
          stroke="currentColor"
          strokeWidth="0.63"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0 9.078)"
        />
      </g>
    </svg>
  );
}

export function ShieldIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M 11 4 L 11 0.5 C 11 0.367 10.947 0.24 10.854 0.146 C 10.76 0.053 10.633 0 10.5 0 L 0.5 0 C 0.367 0 0.24 0.053 0.146 0.146 C 0.053 0.24 0 0.367 0 0.5 L 0 4 C 0 10 5.5 11.5 5.5 11.5 C 5.5 11.5 11 10 11 4 Z"
        stroke="currentColor"
        strokeWidth="0.63"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(2.5 3)"
      />
    </svg>
  );
}

export function ArrowUpRightIcon({ className = "w-3 h-3", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M 11.681 0.441 L 0 12.121 M 2.909 0 L 11.152 0 C 11.687 0 12.121 0.433 12.121 0.97 L 12.121 9.212"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        transform="translate(1.934 1.937)"
      />
    </svg>
  );
}

export function HamburgerIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M 13.333 0 L 0 0" stroke="currentColor" strokeWidth="1" transform="translate(1.333 4)" />
      <path d="M 13.333 0 L 0 0" stroke="currentColor" strokeWidth="1" transform="translate(1.333 8)" />
      <path d="M 13.333 0 L 0 0" stroke="currentColor" strokeWidth="1" transform="translate(1.333 12)" />
    </svg>
  );
}

export function CloseIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M 11.314 11.314 L 0 0"
        stroke="currentColor"
        strokeWidth="1"
        transform="translate(2.345 2.344)"
      />
      <path
        d="M 11.314 0 L 0 11.314"
        stroke="currentColor"
        strokeWidth="1"
        transform="translate(2.341 2.344)"
      />
    </svg>
  );
}

export function TwitterIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M 14.667 13.257 L 10.141 13.257 L 6.596 8.623 L 2.54 13.257 L 0.29 13.257 L 5.545 7.251 L 0 0 L 4.641 0 L 7.845 4.236 L 11.551 0 L 13.8 0 L 8.886 5.616 Z M 2.626 1.275 L 10.762 11.911 L 12.008 11.911 L 3.964 1.275 Z"
        transform="translate(0.666 1.27)"
      />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(0.25 0.25)">
        <path d="M 0.335 0.335 C 0.55 0.121 0.841 0 1.144 0 L 14.356 0 C 14.659 0 14.95 0.121 15.165 0.335 C 15.38 0.55 15.5 0.841 15.5 1.144 L 15.5 14.356 C 15.5 14.659 15.38 14.95 15.165 15.165 C 14.95 15.38 14.659 15.5 14.356 15.5 L 1.144 15.5 C 0.841 15.5 0.55 15.38 0.335 15.165 C 0.121 14.95 0 14.659 0 14.356 L 0 1.144 C 0 0.841 0.121 0.55 0.335 0.335 Z M 2.712 4.547 C 2.931 4.695 3.189 4.774 3.453 4.776 C 3.63 4.78 3.806 4.748 3.97 4.682 C 4.135 4.616 4.284 4.518 4.409 4.393 C 4.535 4.268 4.634 4.119 4.701 3.956 C 4.768 3.792 4.801 3.616 4.799 3.439 C 4.799 3.175 4.721 2.916 4.574 2.696 C 4.428 2.476 4.219 2.305 3.975 2.203 C 3.731 2.101 3.462 2.074 3.203 2.125 C 2.944 2.176 2.705 2.303 2.518 2.489 C 2.33 2.675 2.202 2.913 2.149 3.172 C 2.097 3.431 2.122 3.7 2.222 3.945 C 2.322 4.189 2.493 4.399 2.712 4.547 Z M 9.719 7.606 C 10.373 7.606 10.88 7.974 10.88 9.167 L 10.88 13.211 L 13.209 13.211 L 13.21 8.632 C 13.21 6.371 11.806 5.599 10.506 5.599 C 9.303 5.599 8.515 6.378 8.29 6.833 L 8.26 6.833 L 8.26 5.807 L 6.019 5.807 L 6.019 13.211 L 8.35 13.211 L 8.35 9.197 C 8.35 8.127 9.028 7.606 9.719 7.606 Z M 2.289 13.204 L 4.62 13.204 L 4.62 5.802 L 2.289 5.802 Z" />
      </g>
    </svg>
  );
}

export function GitHubIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function OpenCodeIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M16 6H8v12h8V6zm4 16H4V2h16v20z" />
    </svg>
  );
}

export function ClaudeIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 24 24"
      fill="#D97757"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
    </svg>
  );
}

export function AntigravityIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 24 24"
      fill="#4285F4"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M19.94 20.59c1.09.82 2.73.27 1.23-1.23C16.67 15 17.62 3 12.03 3S7.39 15 2.89 19.36c-1.64 1.64.14 2.05 1.23 1.23c4.23-2.86 3.95-7.91 7.91-7.91s3.68 5.05 7.91 7.91" />
    </svg>
  );
}

export function NpmIcon({ className = "w-4 h-4", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="presentation"
      viewBox="0 0 24 24"
      fill="#CB3837"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
    </svg>
  );
}

