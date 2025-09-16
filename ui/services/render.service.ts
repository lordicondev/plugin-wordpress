import lottie from '@lordicon/internal';
import { customizeIcon } from "@lordicon/utils-lottie";
import { customizeSvg, metaSvg } from '@lordicon/utils-svg';
import { injectable } from "inversify";

type ProgressCallback = (progress: number) => void;
type IconData = any;
type RenderFrameSvgResult = { image: Blob };
type RenderSvgResult = { image: Blob };

const DEBUG = false;

/**
 * Interface for render service.
 */
export interface RenderServiceInterface {
    renderFrameSvg(
        iconData: IconData,
        params?: { sequence?: string, properties?: any },
        progressCallback?: ProgressCallback,
    ): Promise<RenderFrameSvgResult>;

    renderSvg(
        svgPackData: string,
        params?: { properties?: any },
        progressCallback?: ProgressCallback,
    ): Promise<RenderSvgResult>;
}

/**
 * Render service.
*/
@injectable()
export class RenderService implements RenderServiceInterface {
    async renderFrameSvg(
        iconData: IconData,
        params?: { sequence?: string; properties?: any; },
        progressCallback?: ProgressCallback,
    ) {
        progressCallback?.(0.5);
        await new Promise((resolve) => setTimeout(resolve, 1));

        const frameMatch = params?.sequence?.match(/\d+/);
        const customizedIconData = params?.properties ? customizeIcon(iconData, params.properties) : iconData;
        const frame = frameMatch ? parseInt(frameMatch[0], 10) : 0;

        const container = document.createElement('div');
        container.style.position = 'absolute';

        if (DEBUG) {
            container.style.top = '100px';
            container.style.left = '100px';
            container.style.zIndex = '1000';
        } else {
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            container.style.visibility = 'hidden';
        }

        document.body.appendChild(container);

        const player = lottie.loadAnimation({
            loop: false,
            autoplay: false,
            rendererSettings: {
                preserveAspectRatio: "xMidYMid meet",
                progressiveLoad: false,
                hideOnTransparent: false,
            },
            animationData: structuredClone(customizedIconData),
            container,
        });

        // Wait until player is ready
        await new Promise((resolve) => {
            player.addEventListener('DOMLoaded', resolve);
        });

        player.goToAndStop(frame, true);

        // Render frame
        player.renderer.renderFrame(null);

        // Serialize SVG
        const source = new XMLSerializer().serializeToString(container.children[0]);

        if (!DEBUG) {
            document.body.removeChild(container);
        }

        if (!source) {
            throw new Error('Invalid SVG source.');
        }

        const image = new Blob([source], { type: 'image/svg+xml' });

        progressCallback?.(1);
        await new Promise((resolve) => setTimeout(resolve, 1));

        return {
            image,
        }
    }

    async renderSvg(
        svgPackData: string,
        params?: { properties?: any },
        progressCallback?: ProgressCallback,
    ) {
        const meta = metaSvg(svgPackData);

        progressCallback?.(0.5);
        await new Promise((resolve) => setTimeout(resolve, 1));

        const source = customizeSvg(
            svgPackData,
            params?.properties || {},
        );

        if (!source) {
            throw new Error('Invalid SVG source.');
        }

        const image = new Blob([source], { type: 'image/svg+xml' });


        progressCallback?.(1);
        await new Promise((resolve) => setTimeout(resolve, 1));

        return {
            image,
        }
    }
}
