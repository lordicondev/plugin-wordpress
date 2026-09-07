import lottie, { AnimationItem } from '@lordicon/internal';
import { customizeIcon, IconProperties } from '@lordicon/utils-lottie';
import { customizeSvg, optimizeSvg } from '@lordicon/utils-svg';
import { injectable } from 'inversify';

type ProgressCallback = (progress: number) => void;
type IconData = any;

interface RenderSvgResult {
    image: Blob;
}

/** A malformed icon can leave the player without ever announcing itself. */
const READY_TIMEOUT = 15000;

/**
 * Waits for a lottie player to finish parsing.
 * @param player - The player to wait on.
 * @returns Resolves once the player has built its DOM.
 */
function waitForPlayer(player: AnimationItem): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timed out while loading icon data.'));
        }, READY_TIMEOUT);

        player.addEventListener('DOMLoaded', () => {
            clearTimeout(timer);
            resolve();
        });
    });
}

/**
 * Interface for render service.
 */
export interface RenderServiceInterface {
    renderFrameSvg(
        iconData: IconData,
        params?: { sequence?: string, properties?: IconProperties },
        progressCallback?: ProgressCallback,
    ): Promise<RenderSvgResult>;

    renderSvg(
        svgPackData: string,
        params?: { properties?: IconProperties },
        progressCallback?: ProgressCallback,
    ): Promise<RenderSvgResult>;
}

/**
 * Render service.
 *
 * WordPress renders no images. It uploads the Lottie file itself and, alongside it, a single
 * SVG frame that stands in until the animation comes alive — so both methods here produce
 * SVG, and the raster pipeline the Figma and Slides plugins carry has no counterpart.
 *
 * The two methods answer different questions. `renderFrameSvg` draws a frame *out of* an
 * animation; `renderSvg` customises artwork that is already a single frame.
 *
 * On why this drives lottie directly rather than going through `@lordicon/renderer`, whose
 * `svg` target does the same job: the renderer bundles its own unshakeable copy of the same
 * lottie fork, which adds ~650 KB to each admin bundle, and it produces the same
 * non-deterministic output, because it serialises a live player's DOM in exactly the same
 * way. It would have cost size and bought nothing. Both problems this file used to have —
 * leaked players and a serialisation that changed on every run — are solved below instead.
 */
@injectable()
export class RenderService implements RenderServiceInterface {
    /**
     * Renders one frame of a Lottie animation as SVG.
     *
     * Used for the placeholder that sits under `<lord-icon>` on the published page, which is
     * why the caller asks for frame 0: the pose the animation starts from, so nothing jumps
     * when the player takes over.
     *
     * @param iconData - Raw Lottie icon data.
     * @param params - Frame to draw, as a sequence string, and icon properties to apply.
     * @param progressCallback - Receives a ratio between 0 and 1.
     */
    async renderFrameSvg(
        iconData: IconData,
        params?: { sequence?: string, properties?: IconProperties },
        progressCallback?: ProgressCallback,
    ): Promise<RenderSvgResult> {
        progressCallback?.(0.1);

        const frameMatch = params?.sequence?.match(/\d+/);
        const frame = frameMatch ? parseInt(frameMatch[0], 10) : 0;
        const data = params?.properties ? customizeIcon(iconData, params.properties) : iconData;

        // Lottie's SVG renderer only builds a DOM it can measure, so the player needs a real
        // element. It is parked off-screen and torn down in `finally`.
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.visibility = 'hidden';
        document.body.appendChild(container);

        let player: AnimationItem | undefined;

        try {
            player = lottie.loadAnimation({
                loop: false,
                autoplay: false,
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid meet',
                    progressiveLoad: false,
                    hideOnTransparent: false,
                },
                animationData: structuredClone(data),
                container,
            });

            await waitForPlayer(player);
            progressCallback?.(0.6);

            player.goToAndStop(frame, true);
            player.renderer.renderFrame(null);

            const source = new XMLSerializer().serializeToString(container.children[0]);

            if (!source) {
                throw new Error('Invalid SVG source.');
            }

            // SVGO, besides shrinking the file, rewrites the element ids lottie stamps into
            // its DOM. Those come from a counter global to the page, so the same icon
            // serialised differently depending on what had been rendered before it — two
            // exports of one icon were never byte-identical. Renaming them by order of
            // appearance is what makes the output reproducible.
            const optimized = optimizeSvg(source);

            progressCallback?.(1);

            return { image: new Blob([optimized], { type: 'image/svg+xml' }) };
        } finally {
            // Both matter: destroy() stops the player's animation frame loop, and without it
            // every export leaked one.
            player?.destroy();
            container.remove();
        }
    }

    /**
     * Applies icon properties to an SVG pack.
     *
     * A pack is already a static drawing carrying every state, stroke and colour slot, so
     * this is a string transform with no player and no DOM involved.
     *
     * @param svgPackData - The SVG pack source.
     * @param params - Icon properties to apply.
     * @param progressCallback - Receives a ratio between 0 and 1.
     */
    async renderSvg(
        svgPackData: string,
        params?: { properties?: IconProperties },
        progressCallback?: ProgressCallback,
    ): Promise<RenderSvgResult> {
        progressCallback?.(0.5);

        // Yields a frame so the progress bar can repaint before the transform blocks.
        await new Promise((resolve) => setTimeout(resolve, 1));

        const source = customizeSvg(svgPackData, params?.properties || {});

        if (!source) {
            throw new Error('Invalid SVG source.');
        }

        progressCallback?.(1);

        return { image: new Blob([source], { type: 'image/svg+xml' }) };
    }
}
