import type { Pt } from '../core/geometry';

export function $(root: ParentNode, sel: string): HTMLElement {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el as HTMLElement;
}

/** 画面座標→シーン座標（SVGの現在の変換を使うので、画面サイズ・回転に追従する） */
export function toScene(svg: SVGSVGElement, clientX: number, clientY: number): Pt | null {
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function btn(action: string, icon: string, label: string, cls = '', extra = ''): string {
  return `<button type="button" class="btn ${cls}" data-action="${action}" aria-label="${label}" ${extra}>${icon}<span class="lbl">${label}</span></button>`;
}
