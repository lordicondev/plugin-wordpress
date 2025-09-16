import { readStates } from "@lordicon/utils-lottie";

/**
 * Prepares the trigger type based on the state string.
 * @param state - The state string to handle.
 * @returns The trigger type based on the state.
 */
export function handleTrigger(state: string): 'in' | 'hover' | 'loop' | 'morph' {
    const [firstPart, restPart] = state.split('-');

    if (['in', 'hover', 'loop', 'morph'].includes(firstPart)) {
        return firstPart as any;
    }

    return 'hover';
}

/**
 * Prepares the delay based on the state string.
 * @param state - The state string to handle.
 * @returns The delay in milliseconds based on the state.
 */
export function handleDelay(state: string): number[] {
    const [firstPart, restPart] = state.split('-');

    let delay: number[] = [0, 0];

    if (['loop'].includes(firstPart)) {
        delay = [0, 0];
    } else if (['morph', 'boomerang'].includes(firstPart)) {
        delay = [1000, 1000];
    } else if (['in'].includes(firstPart)) {
        delay = [1500, 1000];
    } else if (['hover'].includes(firstPart)) {
        delay = [2000, 0];
    }

    return delay;
}

/**
 * Handles the boomerang state.
 * @param state - The state string to handle.
 * @returns True if the state should be treated by default as a boomerang, false otherwise.
 */
export function handleBoomerang(state: string): boolean {
    const [firstPart, restPart] = state.split('-');

    return ['morph'].includes(firstPart);
}

export function handleFrame(
    iconData: any,
    params: {
        state?: string,
        frame?: number,
    } = {}
): {
    sequence: string,
} {
    if (params.frame !== undefined) {
        return { sequence: `frame:${params.frame}` };
    }

    const states = readStates(iconData);
    const stateName = params.state || '';
    const state = states.find(c => c.name === stateName)!;

    let framesRatio = 0;
    if (state.params.length) {
        const ratio = parseFloat(state.params[0]);
        if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
            framesRatio = ratio;
        }
    }

    const frame = framesRatio ? state.duration * framesRatio : state.duration;
    const sequence = `frame:${frame}`;
    return {
        sequence,
    };
}

export function handleAnimation(
    iconData: any,
    params: {
        state?: string,
        preview?: boolean,
        intro?: boolean,
        loop?: boolean,
        speed?: number,
        delay?: number[],
    } = {}
) {
    const states = readStates(iconData);
    const frameRate = iconData?.fr || 30;
    const stateName = params.state || '';
    const state = states.find(c => c.name === stateName)!;

    if (!state) {
        throw new Error(`State "${stateName}" not found in icon data.`);
    }

    const preview = params.preview;
    const trigger = handleTrigger(stateName);
    const delay: number[] = params.delay !== undefined ? params.delay : handleDelay(stateName);
    const loop = (trigger !== 'in');
    const boomerang = handleBoomerang(stateName);
    const reverse = false;
    const speed = params.speed !== undefined ? params.speed : 1;

    const sequenceParts: string[] = [];
    const sections: {
        duration: number,
        animation: boolean,
        ratio: number,
        title: string,
    }[] = [];

    let multiple = false;
    let duration = 0;

    const parseDuration = (duration?: number) => {
        return (duration || 0) / frameRate * 1000 * (1 / speed);
    }

    if (['morph'].includes(trigger)) {
        let framesRatio = 0;
        if (state.params.length) {
            const ratio = parseFloat(state.params[0]);
            if (!isNaN(ratio) && ratio > 0 && ratio <= 1) {
                framesRatio = ratio;
            }
        }

        if (loop || boomerang) {
            if (framesRatio) {
                const framesIn = state.duration * framesRatio;
                const segmentIn = [0, framesIn];
                const segmentOut = [framesIn, state.duration];
                const durationIn = state.duration * framesRatio;
                const durationOut = state.duration * (1 - framesRatio);

                if (delay?.[0]) {
                    sequenceParts.push(`delay:${delay?.[0]}`);
                    duration += delay?.[0];
                    sections.push({ duration: delay?.[0], animation: false, ratio: 0, title: 'In delay' });
                }

                sequenceParts.push(`frame:${segmentIn[0]}:${segmentIn[1]}`);
                duration += parseDuration(durationIn);
                sections.push({ duration: parseDuration(durationIn), animation: true, ratio: 0, title: 'Play' });

                if (delay?.[1]) {
                    sequenceParts.push(`delay:${delay?.[1]}`);
                    duration += delay?.[1];
                    sections.push({ duration: delay?.[1], animation: false, ratio: 0, title: 'Delay' });
                }

                sequenceParts.push(`frame:${segmentOut[0]}:${segmentOut[1]}`);
                duration += parseDuration(durationOut);
                sections.push({ duration: parseDuration(durationOut), animation: true, ratio: 0, title: 'Reverse play' });

                multiple = true;
            } else {
                if (delay?.[0]) {
                    sequenceParts.push(`delay:${delay?.[0]}`);
                    duration += delay?.[0];
                    sections.push({ duration: delay?.[0], animation: false, ratio: 0, title: 'In delay' });
                }

                sequenceParts.push('play');
                duration += parseDuration(state?.duration);
                sections.push({ duration: parseDuration(state?.duration), animation: true, ratio: 0, title: 'Play' });

                if (delay?.[1]) {
                    sequenceParts.push(`delay:${delay?.[1]}`);
                    duration += delay?.[1];
                    sections.push({ duration: delay?.[1], animation: false, ratio: 0, title: 'Delay' });
                }

                sequenceParts.push('play:reverse');
                duration += parseDuration(state?.duration);
                sections.push({ duration: parseDuration(state?.duration), animation: true, ratio: 0, title: 'Reverse play' });

                multiple = true;
            }
        } else {
            if (framesRatio) {
                const framesIn = state.duration * framesRatio;
                const segmentIn = [0, framesIn];
                const segmentOut = [framesIn, state.duration];
                const durationIn = state.duration * framesRatio;
                const durationOut = state.duration * (1 - framesRatio);

                if (delay?.[0]) {
                    sequenceParts.push(`delay:${delay?.[0]}`);
                    duration += delay?.[0];
                    sections.push({ duration: delay?.[0], animation: false, ratio: 0, title: 'Delay' });
                }

                if (reverse) {
                    sequenceParts.push(`frame:${segmentOut[0]}:${segmentOut[1]}`);
                    duration += parseDuration(durationOut);
                    sections.push({ duration: parseDuration(durationOut), animation: true, ratio: 0, title: 'Play' });
                } else {
                    sequenceParts.push(`frame:${segmentIn[0]}:${segmentIn[1]}`);
                    duration += parseDuration(durationIn);
                    sections.push({ duration: parseDuration(durationIn), animation: true, ratio: 0, title: 'Play' });
                }
            } else {
                if (delay?.[0]) {
                    sequenceParts.push(`delay:${delay?.[0]}`);
                    duration += delay?.[0];
                    sections.push({ duration: delay?.[0], animation: false, ratio: 0, title: 'Delay' });
                }

                if (reverse) {
                    sequenceParts.push('play:reverse');
                } else {
                    sequenceParts.push('play');
                }

                duration += parseDuration(state?.duration);
                sections.push({ duration: parseDuration(state?.duration), animation: true, ratio: 0, title: 'Play' });
            }
        }
    } else {
        if (delay?.[0]) {
            sequenceParts.push(`delay:${delay?.[0]}`);
            duration += delay?.[0];
            sections.push({ duration: delay?.[0], animation: false, ratio: 0, title: 'Delay' });
        }

        sequenceParts.push('play');
        duration += parseDuration(state?.duration);
        sections.push({ duration: parseDuration(state?.duration), animation: true, ratio: 0, title: 'Play' });
    }

    if (sequenceParts.length && !loop && preview) {
        sequenceParts.push('idle');
    }

    if (!sequenceParts.length) {
        sequenceParts.push('play');
        duration += parseDuration(state?.duration);
        sections.push({ duration: parseDuration(state?.duration), animation: true, ratio: 0, title: 'Play' });
    }

    // Update ratios.
    sections.forEach((section) => {
        section.ratio = section.duration / duration;
    });

    return {
        sequence: sequenceParts.join(','),
        duration,
        sections,
        multiple,
    }
}