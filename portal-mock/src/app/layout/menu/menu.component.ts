import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {SessionService} from "../../core/services/session.service";
import {NgIf, NgFor} from "@angular/common";
import {TranslateModule} from "@ngx-translate/core";
import {FormsModule} from "@angular/forms";
import {LocalStorageService} from "../../core/services/local-storage.service";
import {environment} from "../../../environment/environment";
import {MOCK_USERS, MockUser} from "../../core/mock-data/mock-users";

const isStandalone = environment.standalone;

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, TranslateModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  autoPolling: boolean = true;
  readonly isStandalone = isStandalone;
  readonly mockUsers = MOCK_USERS;
  selectedMockUser: MockUser = MOCK_USERS[0];

  constructor(private sessionService: SessionService, private router: Router, private localStorageService: LocalStorageService) {
    this.localStorageService.saveAutoPolling(this.autoPolling);
  }

  public isAuthenticated() {
    return this.sessionService.isAuthenticated();
  }

  public login() {
    this.router.navigate(["login"]).then(() => {
      location.reload();
    });
  }

  public logout() {
    this.sessionService.logout();
  }

  public isLogged() {
    return this.sessionService.isAuthenticated()
  }

  public updatePollingValue(value: any) {
    this.autoPolling = value.currentTarget.checked;
    this.localStorageService.saveAutoPolling(value.currentTarget.checked);
  }

  public switchMockUser(user: MockUser) {
    this.selectedMockUser = user;
    (this.sessionService as any)._userInfos = user;
    this.sessionService.userInfoSubject.next(user);
  }
}
