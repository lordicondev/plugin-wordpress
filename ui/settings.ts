import './components';
import { defineIconElement } from './helpers';

import { AccountPage, LoginPage, WelcomePage } from './pages';

const container = document.getElementById('lordicon')!;

let status = __LORDICON__.status || null;

function reload() {
    container.innerHTML = '';

    let element: HTMLElement | null = null;

    if (status?.user) {
        let accountPage = element = new AccountPage();
        accountPage.status = status;

        accountPage.addEventListener('logout', () => {
            status = null;
            reload();
        });
    } else {
        let welcomePage = element = new WelcomePage();

        welcomePage.addEventListener('finish', () => {
            container.innerHTML = '';

            let loginPage = new LoginPage();
            loginPage.addEventListener('login', (event: Event) => {
                const data = (event as CustomEvent<{ status: any, email: string }>).detail;
                status = data.status;
                reload();
            });
            container.appendChild(loginPage);
        });
    }

    if (element) {
        container.appendChild(element);
    }
}

// Reload the page on status change.
reload();

// Define icon element globally.
defineIconElement();