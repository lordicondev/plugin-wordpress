import './components';
import { defineIconElement } from './helpers';

import { AccountPage, LoginPage, WelcomePage } from './pages';

/**
 * Entry point for the wp-admin settings screen.
 *
 * There is no router here — the screen is three states deep at most, so it swaps the whole
 * container instead. `status` comes from PHP via `window.__LORDICON__` and is re-read from
 * the login response, which is why it is module state rather than a parameter.
 */

// Before any page is constructed: <li-icon> has to exist by the time a page renders one.
defineIconElement();

const container = document.getElementById('lordicon')!;

let status = __LORDICON__.status || null;

/**
 * Signed-in view. Logging out drops the status and falls back to the welcome screen.
 */
function accountPage(): HTMLElement {
    const page = new AccountPage();
    page.status = status;

    page.addEventListener('logout', () => {
        status = null;
        show();
    });

    return page;
}

/**
 * First-run view. Its `finish` event moves on to the login form.
 */
function welcomePage(): HTMLElement {
    const page = new WelcomePage();

    page.addEventListener('finish', () => {
        container.replaceChildren(loginPage());
    });

    return page;
}

/**
 * Email plus one-time code. On success the new status is adopted and the screen re-renders,
 * which lands on the account page.
 */
function loginPage(): HTMLElement {
    const page = new LoginPage();

    page.addEventListener('login', (event: Event) => {
        status = (event as CustomEvent<{ status: unknown, email: string }>).detail.status;
        show();
    });

    return page;
}

/**
 * Renders whichever page the current status calls for.
 */
function show() {
    container.replaceChildren(status?.user ? accountPage() : welcomePage());
}

show();
