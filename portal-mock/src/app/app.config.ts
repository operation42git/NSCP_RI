import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {SessionService} from "./core/services/session.service";
import {loadUserInfos} from "./core/factories/load-user-info.factory";
import {LoaderInterceptor} from "./core/interceptors/loader.interceptor";
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideToastr} from "ngx-toastr";
import {ErrorInterceptor} from "./core/interceptors/error.interceptor";
import {NgMultiSelectDropDownModule} from "ng-multiselect-dropdown";
import {MockApiInterceptor} from "./core/interceptors/mock-api.interceptor";
import {environment} from "../environment/environment";
import {DEFAULT_MOCK_USER} from "./core/mock-data/mock-users";

const isStandalone = environment.standalone;

function initMockUser(sessionService: SessionService): () => Promise<void> {
  return () => {
    (sessionService as any)._userInfos = DEFAULT_MOCK_USER;
    sessionService.userInfoSubject.next(DEFAULT_MOCK_USER);
    return Promise.resolve();
  };
}

const standaloneProviders = [
  {provide: HTTP_INTERCEPTORS, useClass: MockApiInterceptor, multi: true},
  {
    provide: APP_INITIALIZER,
    useFactory: initMockUser,
    deps: [SessionService],
    multi: true
  },
];

const backendProviders = [
  {
    provide: APP_INITIALIZER,
    useFactory: loadUserInfos,
    deps: [SessionService],
    multi: true
  },
  {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    provideToastr(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
        defaultLanguage : 'hr'
      }),
      NgMultiSelectDropDownModule.forRoot()
    ),
    SessionService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLanguage,
      deps: [TranslateService],
      multi: true
    },
    {provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true},
    ...(isStandalone ? standaloneProviders : backendProviders),
  ]
};

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
}

export function initializeLanguage(translate: TranslateService): () => Promise<any> {
  return () => {
    translate.setDefaultLang('hr');
    return translate.use('hr').toPromise().catch(() => Promise.resolve());
  };
}
