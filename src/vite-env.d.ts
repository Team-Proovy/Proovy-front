/// <reference types="vite/client" />
import React from "react";

type MathFieldProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  // Allow custom props for the web component
  [key: string]: any;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": MathFieldProps;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": MathFieldProps;
    }
  }
}
