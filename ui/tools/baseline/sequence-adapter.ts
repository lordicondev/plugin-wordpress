import { animationSequence, parseTrigger, triggerDelay } from '../../helpers';
import { SectionInterface } from '../../types';
import { RenderCase } from './cases';

/**
 * Translates a neutral `RenderCase` into the calls the animation helpers accept.
 *
 * This file is the seam that lets `cases.ts` stay fixed while the model underneath it
 * changes, so a before/after diff shows behaviour rather than renamed parameters.
 */

export interface SequenceResult {
    supported: boolean;
    trigger?: string;
    sequence?: string;
    sections?: SectionInterface[];
    defaultDelay?: number[];
}

/**
 * Builds the playback sequence for a case.
 * @param iconData - Raw Lottie icon data.
 * @param testCase - The case to build for.
 * @returns The sequence and its annotated sections.
 */
export function buildAnimationSequence(iconData: unknown, testCase: {
    state: string;
    playback: 'once' | 'reverse' | 'boomerang' | 'continuous';
    delay: number[];
    speed: number;
}): SequenceResult {
    const trigger = parseTrigger(testCase.state);

    const result = animationSequence(iconData, {
        state: testCase.state,
        playback: testCase.playback,
        delay: testCase.delay,
        speed: testCase.speed,
    });

    return {
        supported: true,
        trigger,
        defaultDelay: triggerDelay(trigger),
        ...result,
    };
}

/**
 * The sequence used for the static placeholder.
 *
 * Always frame 0, matching `EditorPage.export()`. This is not the same choice the portal
 * and the Figma plugin make: their static export shows the *finished* pose, because it is
 * the artwork. Here the SVG sits underneath a live animation until the visitor interacts
 * with it, so it has to show the pose the animation starts from — otherwise the icon jumps
 * the moment it comes alive.
 *
 * @param _iconData - Unused; kept so the adapter's shape survives a change of policy.
 * @param _testCase - Unused, for the same reason.
 */
export function buildFrameSequence(_iconData: unknown, _testCase: RenderCase): string {
    return 'frame:0';
}
