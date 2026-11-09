import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";
import { Architecture } from "./Architecture";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";
import { Compare } from "./Compare";
import { Demo } from "./Demo";

type MDXComponents = Record<string, ComponentType<never>>;

/**
 * Components available inside every project MDX file (SPEC §6). Fenced code blocks render
 * through CodeBlock (file name tab + copy button). Components that need the project's own data
 * (Gallery, Video, Board3D) are bound by the page and passed in through `components`.
 */
const shared = {
  Architecture,
  Callout,
  Compare,
  Demo,
  pre: CodeBlock,
} as unknown as MDXComponents;
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

export function MDXContent({ code, components }: { code: string; components?: MDXComponents }) {
  const Content = evaluate(code);
  // eslint-disable-next-line react-hooks/static-components -- evaluated once per page at build time
  return <Content components={{ ...shared, ...components }} />;
}
