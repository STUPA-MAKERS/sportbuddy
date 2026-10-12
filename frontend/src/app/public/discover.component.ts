import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '@stupa-makers/ui-kit';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap, timer } from 'rxjs';
import { ApiService, PublicRequest } from '../shared/api.service';
import { ago, isThisWeek } from '../shared/format';
import { isPhone } from '../shared/media';
import { SymbolComponent } from '../shared/symbol.component';
import { RequestDetailComponent } from './request-detail.component';

const VISIBLE_CHIPS = 6;

/** "Sportpartner finden": search, sport chips and the list, with the detail sheet beside it. */
@Component({
  selector: 'app-discover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, SymbolComponent, RequestDetailComponent],
  templateUrl: './discover.component.html',
})
export class DiscoverComponent {
  protected readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly phone = isPhone();

  /** Route parameter `anfrage/:id`. */
  readonly id = input<string | undefined>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly q = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly sport = signal<string | null>(this.route.snapshot.queryParamMap.get('sport'));
  protected readonly showAllChips = signal(false);
  protected readonly items = signal<PublicRequest[]>([]);
  protected readonly loaded = signal(false);
  /** Skeleton rows appear only when loading takes longer than 300 ms. */
  protected readonly showSkeleton = signal(false);
  protected readonly failed = signal(false);

  protected readonly total = computed(() => this.api.sports().reduce((sum, s) => sum + s.count, 0));
  protected readonly filtered = computed(() => !!this.sport() || !!this.q().trim());

  protected readonly chips = computed(() => {
    const sports = [...this.api.sports()];
    const ranked = sports.filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
    const rest = sports.filter((s) => !ranked.includes(s));
    const ordered = [...ranked, ...rest];
    if (this.showAllChips()) return { shown: ordered, more: 0 };
    const shown = ordered.slice(0, VISIBLE_CHIPS);
    const picked = ordered.find((s) => s.name === this.sport());
    if (picked && !shown.includes(picked)) shown.push(picked);
    return { shown, more: ordered.length - shown.length };
  });

  protected readonly groups = computed(() => {
    const week = this.items().filter((r) => isThisWeek(r.createdAt));
    const older = this.items().filter((r) => !isThisWeek(r.createdAt));
    return [
      { label: 'Diese Woche', items: week },
      { label: 'Früher', items: older },
    ].filter((g) => g.items.length > 0);
  });

  /** The open request: the route's, or on wide screens the first of the list. */
  protected readonly selectedId = computed(() => this.id() ?? (this.phone() ? null : this.items()[0]?.id ?? null));
  protected readonly selectedFromList = computed(() => this.items().find((r) => r.id === this.selectedId()) ?? null);

  private readonly detail$ = toObservable(this.selectedId).pipe(
    distinctUntilChanged(),
    switchMap((id) => {
      if (!id) return of({ id, request: null, missing: false });
      const known = untracked(this.selectedFromList);
      if (known) return of({ id, request: known, missing: false });
      return this.api.get(id).pipe(
        map((request) => ({ id, request, missing: false })),
        catchError(() => of({ id, request: null, missing: true })),
      );
    }),
  );
  protected readonly detail = toSignal(this.detail$, { initialValue: { id: null, request: null, missing: false } });

  protected readonly ago = ago;

  constructor() {
    this.api.loadSports().pipe(takeUntilDestroyed()).subscribe({ error: () => this.failed.set(true) });

    toObservable(computed(() => ({ q: this.q(), sport: this.sport() })))
      .pipe(
        debounceTime(150),
        distinctUntilChanged((a, b) => a.q.trim() === b.q.trim() && a.sport === b.sport),
        tap(() => this.syncQuery()),
        switchMap((filter) => {
          const slow = timer(300).subscribe(() => this.showSkeleton.set(true));
          return this.api.list(filter).pipe(
            tap({ finalize: () => slow.unsubscribe() }),
            catchError(() => {
              this.failed.set(true);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.showSkeleton.set(false);
        this.loaded.set(true);
        if (result) {
          this.failed.set(false);
          this.items.set(result.items);
        }
      });

    // Keep the open request in view on phones after navigating back.
    effect(() => {
      if (this.phone() && this.id()) window.scrollTo({ top: 0 });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const typing = !!target?.closest('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !typing) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  protected pickSport(name: string | null) {
    this.sport.set(this.sport() === name ? null : name);
  }

  protected resetFilters() {
    this.q.set('');
    this.sport.set(null);
  }

  protected iconFor(sport: string) {
    return this.api.iconFor(sport);
  }

  protected subtitle(r: PublicRequest) {
    return [r.sport, r.knowledgeLevel ?? 'Alle Niveaus'].join(' · ');
  }

  protected countFor(name: string) {
    return this.api.sports().find((s) => s.name === name)?.count ?? 0;
  }

  protected closeDetail() {
    this.router.navigate(['/'], { queryParamsHandling: 'preserve' });
  }

  private syncQuery() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.q().trim() || null, sport: this.sport() },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
