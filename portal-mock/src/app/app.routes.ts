import { Routes } from '@angular/router';
import {IdentifiersSearchComponent} from "./pages/identifiers-search/identifiers-search.component";
import {AuthGuard} from "./core/guard/auth.guard";
import {PostLoginGuard} from "./core/guard/post-login.guard";
import {LoginComponent} from "./pages/login/login.component";
import {IdentifiersDisplayComponent} from "./pages/identifiers-display/identifiers-display.component";
import {UilSearchComponent} from "./pages/uil-search/uil-search.component";
import {ECMRDisplayComponent} from "./pages/ecmr-display/ecmr-display.component";
import {environment} from "../environment/environment";

const isStandalone = environment.standalone;
const guard = isStandalone ? [] : [AuthGuard];

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'identifiers',
    pathMatch: 'full'
  },
  {
    path: 'uil',
    component: UilSearchComponent,
    canActivate: guard
  },
  {
    path: 'identifiers',
    component: IdentifiersSearchComponent,
    canActivate: guard
  },
  {
    path: 'identifiers-display/:id',
    component: IdentifiersDisplayComponent,
    canActivate: guard
  },
  ...(isStandalone ? [] : [
    {
      path: 'login',
      component: LoginComponent,
      canActivate: [PostLoginGuard]
    }
  ]),
  {
    path: 'ecmr-display',
    component: ECMRDisplayComponent,
    canActivate: guard
  },
  {
    path: '**',
    redirectTo: 'identifiers',
    pathMatch: 'full'
  }
];
