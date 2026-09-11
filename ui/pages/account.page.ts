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
    busy?: boolean;

    /**
     * Signs out, and only then tells the host screen.
     *
     * The request used to be fired and forgotten, which meant a failed one - an expired nonce,
     * a dropped connection - still moved the UI to the signed-out state while the token stayed
     * in the database, so the next page load silently signed the user back in. It also left the
     * rejected promise unhandled.
     */
    async logout() {
        try {
            this.busy = true;

            await DI.httpService.request('logout');

            this.dispatchEvent(new CustomEvent('logout'));
            DI.toastService.show('Logged out successfully');
        } catch (e: any) {
            DI.toastService.error(e);
        } finally {
            this.busy = false;
        }
    }

    render() {
        const user = this.status?.user;
        const name = user?.firstName;
        const email = user?.email;

        // The account is identified by its email; the first name is a courtesy the API does
        // not always carry. So the name only ever decorates the greeting - when it is absent
        // the email becomes the heading rather than leaving a bare "Hi", and it is not
        // repeated on the line below.
        return html`
            <li-scaffold>
                <li-icon trigger="hover" .icon=${icon} slot="cover"></li-icon>

                <strong>${name ? `Hi ${name}` : (email ?? 'Your account')}</strong>
                ${name && email ? html`<p class="email">${email}</p>` : null}
                <p>Welcome to your account dashboard!</p>

                <li-button ?inert=${this.busy} @click=${this.logout} class="primary" slot="action">Logout</li-button>
            </li-scaffold>
        `;
    }

    static styles = unsafeCSS(CSS);
}
