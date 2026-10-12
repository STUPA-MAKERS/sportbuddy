import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from '@stupa-makers/ui-kit';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent],
  template: `<router-outlet /><app-toast />`,
})
export class App {
  // Applies the saved or preferred theme before the first screen renders.
  protected readonly theme = inject(ThemeService);
}
