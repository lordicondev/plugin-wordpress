import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, state } from 'lit/decorators.js';
import icon from '../assets/dashboard.json';
import { DI } from "../core/di";
import CSS from './account.page.css?raw';

@customElement('li-account-page')
export class AccountPage extends LitElement {
    @property({ type: Object })
    status: any = {};

    @state()
    step: number = 0;

    logout() {
        DI.httpService.request(
            'logout',
        );

        this.dispatchEvent(new CustomEvent('logout'));
    }

    render() {
        return html`
            <li-scaffold>
                <li-icon trigger="hover" .icon=${icon} slot="cover"></li-icon>

                <strong>Hi ${this.status?.user?.firstName}</strong>
                <p>Welcome to your account dashboard!</p>

                <li-button @click=${this.logout} class="brand" slot="action">Logout</li-button>
            </li-scaffold>
        `;
    }

    static styles = unsafeCSS(CSS);
}
