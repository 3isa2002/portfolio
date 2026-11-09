import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";
import { Callout } from "./Callout";

/**
 * Components available inside project MDX files (SPEC §6).
 * Phase 5 adds Architecture, Gallery, Video, Code, Board3D, Compare and Demo here.
 */
const components = {
  Callout,
};

type MDXComponents = Record<string, ComponentType<never>>;
type MDXModule = { default: ComponentType<{ components?: MDXComponents }> };

/**
 * Velite compiles each MDX body to a function-body string at build time.
 * Evaluating it here runs during `next build` only (server component, static export),
 * so no MDX compiler or `new Function` call ever ships to the browser.
 */
function evaluate(code: string): MDXModule["default"] {
  // The constructor is typed as returning `any`; the shape is fixed by Velite's MDX output.
  const fn = new Function(code) as (scope: typeof runtime) => MDXModule;
  return fn({ ...runtime }).default;
}

export function MDXContent({ code }: { code: string }) {
  const Content = evaluate(code);
  // eslint-disable-next-line react-hooks/static-components -- evaluated once per page at build time
  return <Content components={components} />;
}
