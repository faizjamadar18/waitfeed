import type { HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: boolean;
        loop?: boolean;
        mode?: string;
        background?: string;
        speed?: string | number;
      };
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: boolean;
        loop?: boolean;
        mode?: string;
        background?: string;
        speed?: string | number;
      };
    }
  }
}
