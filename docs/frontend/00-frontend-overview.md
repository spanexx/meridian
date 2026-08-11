# Frontend Overview (Angular)

## Overview

The MERIDIAN frontend is an Angular application providing the user interface for members to manage their accounts, submit opportunities, track executions, and view their earnings.

The frontend depends only on the gateway API. The "services" in this document are Angular singleton services (a framework concept) — they call gateway endpoints that map to engine contracts. The frontend never talks to engines, providers, or the kernel directly.

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Core module (singleton services)
│   │   │   ├── auth/               # Authentication service
│   │   │   ├── api/                # API client services
│   │   │   ├── guards/             # Route guards
│   │   │   ├── interceptors/       # HTTP interceptors
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/                  # Shared module (reusable)
│   │   │   ├── components/         # Shared components
│   │   │   ├── directives/         # Shared directives
│   │   │   ├── pipes/              # Shared pipes
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/               # Login, register, password
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   ├── capital/            # Deposits, withdrawals, balance
│   │   │   ├── opportunities/      # Signal submission, tracking
│   │   │   ├── executions/         # Execution monitoring
│   │   │   ├── payouts/            # Payout history
│   │   │   ├── profile/            # Profile, settings, KYC
│   │   │   ├── vetting/            # Vetting queue (vetters)
│   │   │   └── admin/              # Admin panel (admins)
│   │   │
│   │   ├── state/                   # NgRx state management
│   │   │   ├── auth/
│   │   │   ├── capital/
│   │   │   ├── opportunities/
│   │   │   └── index.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── i18n/                    # Translation files
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   ├── environment.prod.ts
│   │   └── environment.staging.ts
│   │
│   └── styles/
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── styles.scss
│
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Core Module

### Auth Service
```typescript
// src/app/core/auth/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    this.loadStoredToken();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/auth/login', credentials)
      .pipe(
        tap(response => this.handleAuthentication(response)),
        catchError(this.handleError)
      );
  }

  logout(): void {
    this.storage.removeItem('access_token');
    this.storage.removeItem('refresh_token');
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.storage.getItem('refresh_token');
    return this.http.post<TokenResponse>('/api/v1/auth/refresh', { refresh_token: refreshToken })
      .pipe(
        tap(response => this.handleAuthentication(response)),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Session expired'));
        })
      );
  }

  private handleAuthentication(response: LoginResponse | TokenResponse): void {
    this.storage.setItem('access_token', response.access_token);
    this.storage.setItem('refresh_token', response.refresh_token);
    this.tokenSubject.next(response.access_token);
  }

  get isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }
}
```

### API Client
```typescript
// src/app/core/api/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params });
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`);
  }
}
```

### Auth Interceptor
```typescript
// src/app/core/interceptors/auth.interceptor.ts
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.currentToken;
    
    if (token && !req.url.includes('/auth/')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/refresh')) {
          return this.authService.refreshToken().pipe(
            switchMap(() => {
              const newToken = this.authService.currentToken;
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next.handle(newReq);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}
```

### Auth Guard
```typescript
// src/app/core/guards/auth.guard.ts
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: route.url.join('/') }
      });
      return false;
    }

    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && !this.authService.hasRoles(requiredRoles)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
```

---

## Routing Structure

```typescript
// src/app/app-routing.module.ts
const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  { path: 'register', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  
  // Protected routes
  { 
    path: 'dashboard', 
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'capital', 
    loadChildren: () => import('./features/capital/capital.module').then(m => m.CapitalModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'opportunities', 
    loadChildren: () => import('./features/opportunities/opportunities.module').then(m => m.OpportunitiesModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'executions', 
    loadChildren: () => import('./features/executions/executions.module').then(m => m.ExecutionsModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'payouts', 
    loadChildren: () => import('./features/payouts/payouts.module').then(m => m.PayoutsModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'profile', 
    loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard]
  },
  
  // Vetter routes
  { 
    path: 'vetting', 
    loadChildren: () => import('./features/vetting/vetting.module').then(m => m.VettingModule),
    canActivate: [AuthGuard],
    data: { roles: ['VETTER', 'ADMIN'] }
  },
  
  // Admin routes
  { 
    path: 'admin', 
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] }
  },
  
  // Error routes
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent }
];
```

---

## State Management (NgRx)

### Auth State
```typescript
// src/app/state/auth/auth.state.ts
export interface AuthState {
  member: Member | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  member: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Actions
export const login = createAction('[Auth] Login', props<{ credentials: LoginRequest }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ response: LoginResponse }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());
export const logout = createAction('[Auth] Logout');

// Reducer
export const authReducer = createReducer(
  initialAuthState,
  on(login, state => ({ ...state, isLoading: true, error: null })),
  on(loginSuccess, (state, { response }) => ({
    ...state,
    member: response.member,
    isAuthenticated: true,
    isLoading: false
  })),
  on(loginFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),
  on(logout, () => initialAuthState)
);

// Selectors
export const selectAuth = (state: AppState) => state.auth;
export const selectMember = createSelector(selectAuth, state => state.member);
export const selectIsAuthenticated = createSelector(selectAuth, state => state.isAuthenticated);
```

### Capital State
```typescript
// src/app/state/capital/capital.state.ts
export interface CapitalState {
  balance: BalanceInfo | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

// Actions
export const loadBalance = createAction('[Capital] Load Balance');
export const loadBalanceSuccess = createAction('[Capital] Load Balance Success', props<{ balance: BalanceInfo }>());
export const loadTransactions = createAction('[Capital] Load Transactions', props<{ params: TransactionParams }>());
export const initiateDeposit = createAction('[Capital] Initiate Deposit', props<{ amount: number; method: string }>());
export const requestWithdrawal = createAction('[Capital] Request Withdrawal', props<{ amount: number; methodId: string }>());
```

---

## Key Components

### Dashboard Component
```typescript
// src/app/features/dashboard/dashboard.component.ts
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <app-balance-card [balance]="balance$ | async"></app-balance-card>
      
      <div class="stats-grid">
        <app-stat-card 
          title="Active Executions" 
          [value]="activeExecutions$ | async"
          icon="trending_up">
        </app-stat-card>
        <app-stat-card 
          title="Pending Payouts" 
          [value]="pendingPayouts$ | async"
          icon="payments">
        </app-stat-card>
        <app-stat-card 
          title="Total Earned" 
          [value]="totalEarned$ | async"
          prefix="$"
          icon="account_balance">
        </app-stat-card>
      </div>
      
      <app-recent-activity [activities]="recentActivity$ | async"></app-recent-activity>
      
      <app-pool-status [poolStatus]="poolStatus$ | async"></app-pool-status>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  balance$ = this.store.select(selectBalance);
  activeExecutions$ = this.store.select(selectActiveExecutionsCount);
  pendingPayouts$ = this.store.select(selectPendingPayoutsCount);
  totalEarned$ = this.store.select(selectTotalEarned);
  recentActivity$ = this.store.select(selectRecentActivity);
  poolStatus$ = this.store.select(selectPoolStatus);

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    this.store.dispatch(loadBalance());
    this.store.dispatch(loadPoolStatus());
    this.store.dispatch(loadRecentActivity());
  }
}
```

### Opportunity Form Component
```typescript
// src/app/features/opportunities/components/opportunity-form.component.ts
@Component({
  selector: 'app-opportunity-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field>
        <mat-label>Title</mat-label>
        <input matInput formControlName="title" placeholder="Brief description of opportunity">
      </mat-form-field>

      <mat-form-field>
        <mat-label>Category</mat-label>
        <mat-select formControlName="category">
          <mat-option *ngFor="let cat of categories" [value]="cat.value">
            {{ cat.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description" rows="4"></textarea>
      </mat-form-field>

      <div formGroupName="details">
        <h3>Source Details</h3>
        <div formGroupName="source">
          <mat-form-field>
            <mat-label>Source Name</mat-label>
            <input matInput formControlName="name">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Location</mat-label>
            <input matInput formControlName="location">
          </mat-form-field>
          <mat-form-field>
            <mat-label>URL (optional)</mat-label>
            <input matInput formControlName="url">
          </mat-form-field>
        </div>

        <h3>Acquisition</h3>
        <div formGroupName="acquisition">
          <mat-form-field>
            <mat-label>Estimated Cost</mat-label>
            <input matInput type="number" formControlName="estimated_cost">
            <span matPrefix>$</span>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Quantity</mat-label>
            <input matInput type="number" formControlName="quantity">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Deadline</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="deadline">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <h3>Resale</h3>
        <div formGroupName="resale">
          <mat-form-field>
            <mat-label>Estimated Value</mat-label>
            <input matInput type="number" formControlName="estimated_value">
            <span matPrefix>$</span>
          </mat-form-field>
        </div>
      </div>

      <app-evidence-uploader 
        [opportunityId]="opportunityId"
        (evidenceAdded)="onEvidenceAdded($event)">
      </app-evidence-uploader>

      <div class="calculated-preview" *ngIf="calculated">
        <h3>Projected Outcome</h3>
        <div class="metric">
          <span class="label">Estimated Profit</span>
          <span class="value">{{ calculated.estimated_profit | currency }}</span>
        </div>
        <div class="metric">
          <span class="label">Estimated ROI</span>
          <span class="value">{{ calculated.estimated_roi | number:'1.1-1' }}%</span>
        </div>
        <div class="metric">
          <span class="label">Risk Level</span>
          <span class="value" [class]="calculated.risk_level.toLowerCase()">
            {{ calculated.risk_level }}
          </span>
        </div>
      </div>

      <div class="actions">
        <button mat-button type="button" (click)="saveDraft()">Save Draft</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid">
          Submit for Review
        </button>
      </div>
    </form>
  `
})
export class OpportunityFormComponent {
  @Input() opportunityId: string;
  @Output() submitted = new EventEmitter<void>();

  form: FormGroup;
  categories = OPPORTUNITY_CATEGORIES;
  calculated: CalculatedMetrics;

  constructor(
    private fb: FormBuilder,
    private opportunityService: OpportunityService
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      details: this.fb.group({
        source: this.fb.group({
          name: ['', Validators.required],
          location: ['', Validators.required],
          url: ['']
        }),
        acquisition: this.fb.group({
          estimated_cost: [null, [Validators.required, Validators.min(100)]],
          quantity: [null, [Validators.required, Validators.min(1)]],
          deadline: [null, Validators.required]
        }),
        resale: this.fb.group({
          estimated_value: [null, [Validators.required, Validators.min(100)]],
          channels: [[]],
          time_to_liquidate: ['']
        })
      })
    });

    // Calculate metrics on value changes
    this.form.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => this.calculateMetrics());
  }

  private calculateMetrics(): void {
    const values = this.form.value;
    const cost = values.details?.acquisition?.estimated_cost || 0;
    const value = values.details?.resale?.estimated_value || 0;

    if (cost > 0 && value > 0) {
      const profit = value - cost;
      const roi = (profit / cost) * 100;

      this.calculated = {
        estimated_profit: profit,
        estimated_roi: roi,
        risk_level: this.calculateRiskLevel(roi, values.category)
      };
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.opportunityService.submitOpportunity(this.form.value)
        .subscribe(() => this.submitted.emit());
    }
  }
}
```

---

## Services

### Capital Service
```typescript
// src/app/features/capital/services/capital.service.ts
@Injectable({ providedIn: 'root' })
export class CapitalService {
  constructor(private api: ApiService) {}

  getBalance(): Observable<BalanceInfo> {
    return this.api.get<BalanceInfo>('/capital/balance')
      .pipe(map(response => response.data));
  }

  getTransactions(params: TransactionParams): Observable<TransactionList> {
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());
    
    return this.api.get<TransactionList>('/capital/transactions', httpParams)
      .pipe(map(response => response.data));
  }

  initiateDeposit(request: DepositRequest): Observable<DepositResponse> {
    return this.api.post<DepositResponse>('/capital/deposits', request)
      .pipe(map(response => response.data));
  }

  requestWithdrawal(request: WithdrawalRequest): Observable<WithdrawalResponse> {
    return this.api.post<WithdrawalResponse>('/capital/withdrawals', request)
      .pipe(map(response => response.data));
  }

  verifyWithdrawal(withdrawalId: string, code: string): Observable<void> {
    return this.api.post<void>(`/capital/withdrawals/${withdrawalId}/verify`, { code })
      .pipe(map(() => void 0));
  }

  getPoolStatus(): Observable<PoolStatus> {
    return this.api.get<PoolStatus>('/capital/pool/status')
      .pipe(map(response => response.data));
  }
}
```

---

## Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  wsUrl: 'ws://localhost:8080/ws',
  stripePublicKey: 'pk_test_xxx',
  sentryDsn: ''
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.meridian.com/api/v1',
  wsUrl: 'wss://api.meridian.com/ws',
  stripePublicKey: 'pk_live_xxx',
  sentryDsn: 'https://xxx@sentry.io/xxx'
};
```

---

## Build & Deploy

```bash
# Development
ng serve

# Production build
ng build --configuration=production

# Run tests
ng test

# E2E tests
ng e2e
```
