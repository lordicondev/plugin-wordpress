import { injectable } from "inversify";
import { html, LitElement, unsafeCSS } from "lit";
import { customElement, state } from 'lit/decorators.js';
import welcome1 from '../assets/welcome-1.json';
import welcome2 from '../assets/welcome-2.json';
import welcome3 from '../assets/welcome-3.json';
import CSS from './welcome.page.css?raw';

function step_1() {
    return html`
        <strong>Browse & Search</strong>
        <p>Explore our full library of animated icons. Use keywords to quickly find the perfect icon for your design.</p>
    `;
}

function step_2() {
    return html`
        <strong>Customize</strong>
        <p>Swap colors, stroke width or size of the animated icon directly in ${__TITLE__}.</p>
    `;
}

function step_3() {
    return html`
        <strong>Choose a Format</strong>
        <p>Choose the format that fits your design best: JSON for animations or SVG for static visuals.</p>
    `;
}

const STEPS = [
    step_1,
    step_2,
    step_3,
]

const IMAGES = [
    welcome1,
    welcome2,
    welcome3,
]

@injectable()
@customElement('li-welcome-page')
export class WelcomePage extends LitElement {
    @state()
    step: number = 0;

    finish() {
        this.dispatchEvent(new CustomEvent('finish'));
    }

    nextStep() {
        if (this.step >= STEPS.length - 1) {
            this.finish();
            return;
        } else {
            this.step = this.step + 1;
        }
    }

    render() {
        const stepContent = STEPS[this.step]();

        return html`
            <li-scaffold>
                <li-icon trigger="hover" .icon=${IMAGES[this.step]} slot="cover"></li-icon>
                    
                <p>${this.step + 1}/${STEPS.length}</p>

                ${stepContent}
            
                ${this.step < STEPS.length - 1 ? html`<li-button @click=${this.finish} class="link" slot="action">Skip</li-button>` : null}
                <li-button @click=${this.nextStep} class="brand" slot="action">${this.nextLabel}</li-button>
            </li-scaffold>
        `;
    }

    get nextLabel() {
        return this.step === 2 ? 'Let’s start!' : 'Next';
    }

    static styles = unsafeCSS(CSS);
}
