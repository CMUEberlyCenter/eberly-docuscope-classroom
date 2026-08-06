import { TestBed } from '@angular/core/testing';
import { Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutingModule, routes } from './app-routing.module';
import { beforeEach, describe, expect, it } from 'vitest';

describe('AppRoutingModule', () => {
  let appRoutingModule: AppRoutingModule;
  let router: Router;

  beforeEach(async () => {
    appRoutingModule = new AppRoutingModule();
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot(routes)],
      declarations: [],
      providers: [],
    }).compileComponents();
    router = TestBed.inject(Router);
    router.initialNavigation();
  });

  it('should create an instance', () => {
    void expect(appRoutingModule).toBeTruthy();
  });

  // TODO: add tests to see if routing to the right place.
  it('navigate to ""', async () => {
    expect(() => router.navigate([''])).not.toThrow();
  });
  it('navigate to "mtv"', async () => {
    expect(() => router.navigate(['mtv'])).not.toThrow();
  });
  it('navigate to "boxplot"', async () => {
    expect(() => router.navigate(['boxplot'])).not.toThrow();
  });
  it('navigate to "bubble"', async () => {
    expect(() => router.navigate(['bubble'])).not.toThrow();
  });
  it('navigate to "groups"', async () => {
    expect(() => router.navigate(['groups'])).not.toThrow();
  });
  it('navigate to "patterns"', async () => {
    expect(() => router.navigate(['patterns'])).not.toThrow();
  });
  it('navigate to "frequency"', async () => {
    expect(() => router.navigate(['frequency'])).not.toThrow();
  });
  it('navigate to "report"', async () => {
    expect(() => router.navigate(['report'])).not.toThrow();
  });
  it('navigate to "scatterplot"', async () => {
    expect(() => router.navigate(['scatterplot'])).not.toThrow();
  });
});
