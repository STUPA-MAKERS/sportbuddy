import 'altcha';
import 'altcha/i18n/de';

import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

/**
 * The ALTCHA proof of work as a form control: the value is the payload once the widget
 * has verified, and '' otherwise. Resetting the control to '' resets the widget.
 */
@Component({
  selector: 'app-altcha',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AltchaComponent), multi: true }],
  template: `<altcha-widget #widget challenge="/api/altcha/challenge" language="de" (statechange)="onState($event)"></altcha-widget>`,
})
export class AltchaComponent implements ControlValueAccessor {
  private readonly widget = viewChild<ElementRef<HTMLElement & { reset?: () => void }>>('widget');
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  onState(event: Event) {
    const detail = (event as CustomEvent<{ state: string; payload?: string }>).detail;
    this.onChange(detail.state === 'verified' && detail.payload ? detail.payload : '');
    this.onTouched();
  }

  writeValue(value: string | null): void {
    if (!value) this.widget()?.nativeElement.reset?.();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
