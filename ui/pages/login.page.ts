import { injectable } from "inversify";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, query, state } from 'lit/decorators.js';
import login1 from '../assets/login-1.json';
import login2 from '../assets/login-2.json';
import { AuthCodeComponent } from "../components/auth-code.component";
import { InputComponent } from "../components/input.component";
import { DI } from "../core";
import CSS from './login.page.css?raw';

const REGISTER_URL = `${__WEBSITE__}/register`;

function validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function renderEmail(this: LoginPage) {
    return html`
        <li-icon trigger="hover" .icon=${login1} slot="cover"></li-icon>
        <strong>Welcome to Lordicon for ${__TITLE__}</strong>
        <p>Bring your designs to life with animated icons.</p>

        <div class="fields">
            <li-field>
                <li-input placeholder="Email" @enter=${this.checkEmail} @change=${this.changeEmail}></li-input>
            </li-field>
        </div>
    `;
}

function renderCode(this: LoginPage) {
    return html`
        <li-icon trigger="hover" .icon=${login2} slot="cover"></li-icon>
        <strong>Confirm your account</strong>
        <p>The 6-digit verification code sent to your inbox.</p>

        <div class="fields small">
            <li-auth-code @enter=${this.checkCode}></li-auth-code>
        </div>
    `;
}

@injectable()
@customElement('li-login-page')
export class LoginPage extends LitElement {
    @query('li-input')
    emailInput?: InputComponent;

    @query('li-auth-code')
    codeInput?: AuthCodeComponent;

    @state()
    currentEmail?: string;

    @state()
    busy?: boolean;

    async checkEmail() {
        const email = this.emailInput?.value!;

        if (!validateEmail(email)) {
            this.emailInput!.parentElement!.classList.add('error');
            return;
        } else {
            this.emailInput!.parentElement!.classList.remove('error');
        }

        try {
            this.busy = true;

            await DI.httpService.request(
                'auth_start',
                {
                    email,
                },
            );

            this.currentEmail = email;
        } catch (e: any) {
            DI.toastService.error(e);
        } finally {
            this.busy = false;
        }
    }

    async checkCode() {
        const email = this.currentEmail;
        const code = this.codeInput!.value;

        try {
            this.busy = true;

            await DI.httpService.request(
                'auth_check',
                {
                    email,
                    code,
                },
            );

            const status = await DI.httpService.request('status');
            this.dispatchEvent(new CustomEvent('login', {
                detail: {
                    email: this.currentEmail,
                    status,
                },
            }));

            DI.toastService.show('Logged in successfully');
        } catch (e: any) {
            DI.toastService.error(e);
        } finally {
            this.busy = false;
        }
    }

    changeEmail() {
        this.emailInput!.parentElement!.classList.remove('error');
    }

    render() {
        const continueLabel = __SUPPORT_NEW_TAB__ ? html`
            <p>
                <small>To continue, please log in to your Lordicon account. If you don't have an account, please <a href=${REGISTER_URL} target="_blank">register</a>.</small>
            </p>
        `: html`
            <p>
                <small>To continue, please log in to your Lordicon account.</small>
            </p>
        `;

        return html`
            <li-scaffold>
                ${this.currentEmail ? renderCode.call(this) : renderEmail.call(this)}

                ${continueLabel}

                <li-button 
                    ?inert=${this.busy} 
                    @click=${!this.currentEmail ? this.checkEmail : this.checkCode} 
                    class="brand" slot="action"
                >Continue</li-button>
            </li-scaffold>
        `;
    }

    static styles = unsafeCSS(CSS);
}
