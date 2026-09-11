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

const TOUR_SEEN_KEY = 'lordicon.tourSeen';

let status = __LORDICON__.status || null;

/**
 * Whether the onboarding tour has already run in this browser.
 *
 * Storage access throws outright in some privacy modes, and a browser that cannot remember
 * this is no reason to fail the screen — it only means the tour runs again.
 */
function tourSeen(): boolean {
    try {
        return localStorage.getItem(TOUR_SEEN_KEY) === '1';
    } catch {
        return false;
    }
}

function markTourSeen(): void {
    try {
        localStorage.setItem(TOUR_SEEN_KEY, '1');
    } catch {
        // Nothing to recover from: the tour simply shows again next time.
    }
}

/**
 * Signed-in view. Logging out goes straight to the login form rather than back through the
 * tour: someone who has just signed out has already seen it, and signing back in is the only
 * thing the screen offers them next.
 */
function accountPage(): HTMLElement {
    const page = new AccountPage();
    page.status = status;

    page.addEventListener('logout', () => {
        status = null;
        container.replaceChildren(loginPage());
    });

    return page;
}

/**
 * First-run view. Its `finish` event moves on to the login form, and marks the tour as seen so
 * a reload does not start it over. Both `Skip` and the final step dispatch it.
 */
function welcomePage(): HTMLElement {
    const page = new WelcomePage();

    page.addEventListener('finish', () => {
        markTourSeen();
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
    if (status?.user) {
        container.replaceChildren(accountPage());
        return;
    }

    container.replaceChildren(tourSeen() ? loginPage() : welcomePage());
}

show();
