import { html, LitElement, unsafeCSS } from "lit";
import { customElement, property, query } from 'lit/decorators.js';
import lordiconImage from '../assets/lordicon.svg';
import { createPopover, popover, tooltip } from "../directives";
import CSS from './footer.component.css?raw';
import { ListComponent } from "./list.component";

interface MenuItem {
    id: string;
    title: string;
}

@customElement('li-footer')
export class FooterComponent extends LitElement {
    @query('li-list', true)
    listComponent?: ListComponent;

    @query('li-pictogram', true)
    menuButton?: HTMLElement;

    @property()
    email: string = '';

    @property()
    premium: boolean = false;

    _popover = createPopover();

    constructor() {
        super();
    }

    logout() {
        this.dispatchEvent(new CustomEvent('logout'));
    }

    menuSelect(e: CustomEvent) {
        this._popover.close();

        const action = e.detail.value;

        if (action === 'homepage') {
            window.open(`${__WEBSITE__}/`, '_blank');
        } else if (action === 'account') {
            window.open(`${__WEBSITE__}/account`, '_blank');
        } else if (action === 'plugin-guide') {
            window.open(`${__WEBSITE__}/docs/${__APP__}`, '_blank');
        } else if (action === 'license') {
            window.open(`${__WEBSITE__}/account/license`, '_blank');
        } else if (action === 'support') {
            window.open(`${__WEBSITE__}/docs/support`, '_blank');
        } else if (action === 'subscribe') {
            window.open(`${__WEBSITE__}/pricing`, '_blank');
        } else if (action === 'logout') {
            this.dispatchEvent(new CustomEvent('logout'));
        }
    }

    openPopover() {
        this._popover.open('menu', this.menuButton!);
    }

    render() {
        const logo = __SUPPORT_NEW_TAB__ ? html`
            <a href=${__WEBSITE__} target="_blank" ${tooltip('Visit Lordicon')}>
                <img src=${lordiconImage} alt="" />
            </a>` : html`
            <img src=${lordiconImage} alt="" />
            `;

        return html`
            ${logo}
            <div class="title">${this.email}</div>

            <div class="actions">
                <li-pictogram class="clickable" icon="dots" ${tooltip('More')} @click=${this.openPopover}></li-pictogram>
            </div>

            <li-list class="shadow" .items=${this.items} @change=${this.menuSelect} ${popover(this._popover)}></li-list>
        `;
    }

    get items(): MenuItem[] {
        const newTabLinks: MenuItem[] = [
            {
                id: 'homepage',
                title: 'Homepage',
            },
            {
                id: 'account',
                title: 'Account',
            },
            {
                id: 'plugin-guide',
                title: 'Plugin Guide',
            },
            {
                id: 'license',
                title: 'License',
            },
            {
                id: 'support',
                title: 'Support',
            },
        ]

        if (!this.premium) {
            newTabLinks.push({
                id: 'subscribe',
                title: 'Subscribe to PRO',
            });
        }

        return [
            ...(__SUPPORT_NEW_TAB__ ? newTabLinks : []),
            {
                id: 'logout',
                title: 'Logout',
            },
        ];
    }

    static styles = unsafeCSS(CSS);
}