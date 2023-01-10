import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutingModule, routes } from './app-routing.module';

describe('AppRoutingModule', () => {
  let appRoutingModule: AppRoutingModule;
  let router: Router;

  beforeEach(async () => {
    appRoutingModule = new AppRoutingModule();
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes)],
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
    await expect(() => router.navigate([''])).not.toThrowError();
  });
  it('navigate to "mtv"', async () => {
    await expect(() => router.navigate(['mtv'])).not.toThrowError();
  });
  it('navigate to "boxplot"', async () => {
    await expect(() => router.navigate(['boxplot'])).not.toThrowError();
  });
  it('navigate to "bubble"', async () => {
    await expect(() => router.navigate(['bubble'])).not.toThrowError();
  });
  it('navigate to "groups"', async () => {
    await expect(() => router.navigate(['groups'])).not.toThrowError();
  });
  it('navigate to "patterns"', async () => {
    await expect(() => router.navigate(['patterns'])).not.toThrowError();
  });
  it('navigate to "frequency"', async () => {
    await expect(() => router.navigate(['frequency'])).not.toThrowError();
  });
  it('navigate to "report"', async () => {
    await expect(() => router.navigate(['report'])).not.toThrowError();
  });
  it('navigate to "scatterplot"', async () => {
    await expect(() => router.navigate(['scatterplot'])).not.toThrowError();
  });
});
