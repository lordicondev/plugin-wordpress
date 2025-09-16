import { Element as LordIconElement } from '@lordicon/element';
import { PictogramComponent } from '../components/pictogram.component';
import { SliderSectionsComponent } from '../components/slider-sections.component';
import { SliderComponent } from '../components/slider.component';

const MAX_VALUE = 500;

export class Progress {
    oldPosition!: number;
    preview: LordIconElement;
    slider: SliderComponent | SliderSectionsComponent;
    playButton: PictogramComponent | undefined;
    sections: any[];

    private rafId: number | null = null;

    constructor(
        preview: LordIconElement,
        slider: SliderComponent | SliderSectionsComponent,
        playButton: PictogramComponent | undefined,
        sections: any[],
    ) {
        this.preview = preview;
        this.slider = slider;
        this.playButton = playButton;
        this.sections = sections;

        this.onReady = this.onReady.bind(this);
        this.onSliderChange = this.onSliderChange.bind(this);
        this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
        this.refreshLoop = this.refreshLoop.bind(this);
    }

    public init() {
        this.slider.maxValue = MAX_VALUE;

        this.preview.addEventListener('ready', this.onReady);
        this.slider.addEventListener('change', this.onSliderChange);
        this.playButton?.addEventListener('click', this.onPlayButtonClick);

        this.rafId = requestAnimationFrame(this.refreshLoop);
    }

    public destroy() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.preview.removeEventListener('ready', this.onReady);
        this.slider.removeEventListener('change', this.onSliderChange);
        this.playButton?.removeEventListener('click', this.onPlayButtonClick);
    }

    private refreshLoop() {
        if (this.playerInstance) {
            this.refresh();
        }
        this.rafId = requestAnimationFrame(this.refreshLoop);
    }

    private onReady() {
        this.refresh();
    }

    private onSliderChange(e: any) {
        this.pause();
        const p = e.detail.value / MAX_VALUE;
        this.playerInstance.frame = p * this.playerInstance.frameCount;
    }

    private onPlayButtonClick(e: MouseEvent) {
        e.preventDefault();

        if (this.triggerInstance.playing) {
            this.pause();
        } else {
            this.play();
        }
    }

    pause() {
        if (this.playButton) {
            this.playButton.icon = 'play';
        }
        this.triggerInstance.pause();
    }

    play() {
        if (this.playButton) {
            this.playButton.icon = 'pause';
        }
        this.triggerInstance.play();
    }

    setPosition(p: number) {
        this.slider.value = p * MAX_VALUE;
    }

    refresh() {
        const playing = this.playerInstance.playing || this.triggerInstance.playing;
        if (this.playButton) {
            if (this.sections.length === 0) {
                this.playButton.icon = playing ? 'pause' : 'play';
            }

            if (this.sections.length > 0 && playing) {
                this.playButton.icon = 'play';
                this.playButton.setAttribute('inert', '');
            } else {
                if (!playing) {
                    this.playButton.removeAttribute('inert');
                }
            }
        }

        const p = this.triggerInstance.progress;
        if (p === this.oldPosition) {
            return;
        }

        this.setPosition(p);
        this.oldPosition = p;
    }

    get triggerInstance() {
        return this.preview.triggerInstance as {
            play(): void;
            pause(): void;
            playing: boolean,
            progress: number,
        };
    }

    get playerInstance() {
        return this.preview.playerInstance!;
    }
}
