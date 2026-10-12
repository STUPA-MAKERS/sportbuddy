import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SYMBOL_PATHS } from './symbols.generated';

/**
 * A Material Symbol (rounded, self-hosted as SVG paths). Used for the sport icons and the
 * few glyphs of the mockups that the ui-kit icon set has no counterpart for.
 */
@Component({
  selector: 'app-symbol',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.width.px]': 'size()', '[style.height.px]': 'size()' },
  template: `<svg viewBox="0 -960 960 960" [attr.width]="size()" [attr.height]="size()" fill="currentColor" focusable="false"><path [attr.d]="d()" /></svg>`,
  styles: [':host{display:inline-block;flex:none;line-height:0}svg{display:block}'],
})
export class SymbolComponent {
  readonly name = input.required<string>();
  readonly size = input(20);
  readonly fill = input(false);

  protected readonly d = computed(() => {
    const name = this.name() in SYMBOL_PATHS || `${this.name()}-fill` in SYMBOL_PATHS ? this.name() : 'sports';
    return SYMBOL_PATHS[this.fill() ? `${name}-fill` : name] ?? SYMBOL_PATHS[name] ?? '';
  });
}
