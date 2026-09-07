import './components';
import './pages';
import { DI } from "./core";
import { defineIconElement } from './helpers';

import iconSvg from './block.svg?raw';

const { useEffect, useState, useCallback, useRef } = wp.element;
const { InspectorControls, InspectorAdvancedControls, useBlockProps } = wp.blockEditor;
const { TextControl, SelectControl } = wp.components;
const { useSelect } = wp.data;
const { useRefEffect } = wp.compose;
const { __ } = wp.i18n;

// Matches EditorPage's default. They used to disagree, so a block with no size of its
// own previewed at one size on the canvas and opened in the editor showing another.
const DEFAULT_SIZE = 128;
const DEFAULT_STROKE = 2;
const DEFAULT_FORMAT = 'json';

const lordIconBlockIcon = (
    <div dangerouslySetInnerHTML={{ __html: iconSvg }} />
);

// Define icon element globally.
defineIconElement();

/**
 * Makes `<lord-icon>` work inside the editor canvas.
 *
 * Since WordPress 7.1 the canvas is always an iframe, with its own document, window and
 * custom-element registry. `defineIconElement()` above runs in the admin page and registers
 * `<li-icon>` there — which is right for the Lit preview in the sidebar, and useless for the
 * canvas: an element inside the iframe never upgrades, stays an unknown inline element with
 * no content, and renders as 0x0.
 *
 * Registering the outer class into the iframe's registry does not work either — a custom
 * element constructor from another realm throws `Illegal constructor`, because the iframe's
 * `HTMLElement` is a different class object. The defining script has to run *inside*.
 *
 * So the module is injected into the canvas document, once. It is the same bundle the
 * published page loads, which is the point: the canvas then renders exactly what a visitor
 * will get, rather than a lookalike.
 *
 * @param {HTMLElement} element - Any element inside the canvas.
 */
function ensureElementInDocument(element) {
    const doc = element.ownerDocument;
    const view = doc.defaultView;

    if (!view || !window.__LORDICON__?.elementUrl) {
        return;
    }

    // Already defined, or a previous block instance already queued the injection.
    if (view.customElements?.get('lord-icon') || doc.querySelector('script[data-lordicon-element]')) {
        return;
    }

    const script = doc.createElement('script');
    script.type = 'module';
    script.dataset.lordiconElement = '';
    script.src = window.__LORDICON__.elementUrl;
    (doc.head || doc.documentElement).appendChild(script);
}

function handleColors(colors) {
    let result = [];

    if (!colors || typeof colors !== 'object') {
        return null;
    }

    Object.entries(colors).map(([key, value]) => {
        result.push(`${key}:${value}`);
    });

    return result.length > 0 ? result.join(',') : null;
}

function handleTrigger(state) {
    if (!state) {
        return 'hover';
    }

    const parts = state.split(':');

    if (parts[0] === 'default') {
        parts.shift();
    }

    const triggerPart = parts[0]?.split('-')?.[0];

    return ['in', 'hover', 'morph', 'loop'].includes(triggerPart) ? triggerPart : 'hover';
}

async function loadIconData(icon) {
    let dataJson;
    let dataSvg;

    if (icon.srcJson) {
        try {
            dataJson = await fetch(icon.srcJson).then(response => response.json());
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            dataJson = null;
        }
    }

    if (icon.srcSvg) {
        try {
            dataSvg = await fetch(icon.srcSvg).then(response => response.text());
        } catch (error) {
            console.error('Error fetching SVG data:', error);
            dataSvg = null;
        }
    }

    return {
        ...icon,
        dataJson,
        dataSvg,
    };
}

const useIconSelected = (callback) => {
    useEffect(() => {
        const handle = (event) => {
            if (event.detail) {
                loadIconData(event.detail.icon).then((iconData) => {
                    callback(iconData);
                }).catch((error) => {
                    console.error('Error loading icon data:', error);
                });
            }
        };

        document.addEventListener('li-icon-selected', handle);
        return () => document.removeEventListener('li-icon-selected', handle);
    }, [callback]);
};

const useIconExported = (callback) => {
    useEffect(() => {
        const handle = (event) => {
            if (event.detail) {
                callback(event.detail);
            }
        };

        document.addEventListener('li-icon-exported', handle);
        return () => document.removeEventListener('li-icon-exported', handle);
    }, [callback]);
};

const useShowLibrary = (callback) => {
    useEffect(() => {
        const handleShowLibrary = () => {
            callback();
        };

        document.addEventListener('li-show-library', handleShowLibrary);
        return () => document.removeEventListener('li-show-library', handleShowLibrary);
    }, [callback]);
};

const useLogin = (callback) => {
    // Guards against a second navigation while the first is still in flight. Scoped to the
    // hook rather than the module: as a module-level flag it was never reset, so returning
    // to the editor without a full page load left login permanently dead.
    const redirecting = useRef(false);

    useEffect(() => {
        const handleLogin = () => {
            if (redirecting.current) return;
            redirecting.current = true;
            callback();
        };

        document.addEventListener('li-login', handleLogin);
        return () => document.removeEventListener('li-login', handleLogin);
    }, [callback]);
};

wp.blocks.registerBlockType('lordicon/block', {
    icon: lordIconBlockIcon,
    edit: ({ attributes, setAttributes, clientId }) => {
        const { icon, properties, jsonAttachmentId, svgAttachmentId } = attributes;
        const [selectedIcon, setSelectedIcon] = useState(null);
        const [attachments, setAttachments] = useState(null);
        const [isPreparingAttachments, setIsPreparingAttachments] = useState(!attachments && (jsonAttachmentId || svgAttachmentId));
        const [messagePreview, setMessagePreview] = useState(__('Insert icon in the panel on the right', 'lordicon'));
        const [isLoadingJson, setIsLoadingJson] = useState(false);

        const blockProps = useBlockProps();

        // Runs against the canvas element, so `ownerDocument` is the iframe's.
        const canvasIconRef = useRefEffect(ensureElementInDocument, []);

        const isInEditor = useSelect((select) => {
            const selectedBlockClientId = select('core/block-editor').getSelectedBlockClientId();
            return selectedBlockClientId === clientId;
        }, [clientId]);

        const editorPageRef = useCallback((node) => {
            if (!isInEditor) return;

            if (node && selectedIcon) {
                const isSameIcon = icon?.family === selectedIcon.family && icon?.style === selectedIcon.style && icon?.index === selectedIcon.index;

                // `display` and `target` belong to the block, not to the icon, so they
                // survive an icon change. The editor does not edit them - it carries them,
                // so that rebuilding `properties` on export cannot drop them.
                const assign = {
                    stroke: properties?.stroke,
                    size: properties?.size,
                    colors: properties?.colors,
                    display: properties?.display,
                    target: properties?.target,
                }

                if (isSameIcon) {
                    Object.assign(assign, {
                        state: properties?.state,
                        playback: properties?.playback,
                        intro: properties?.intro,
                        loop: properties?.loop,
                        speed: properties?.speed,
                        delay: properties?.delay,
                    });
                }

                node.reload(
                    selectedIcon,
                    assign,
                    properties?.format,
                );
            }
        }, [selectedIcon, isInEditor]);

        useEffect(() => {
            const loadData = async () => {
                if (icon && (jsonAttachmentId || svgAttachmentId)) {
                    try {
                        setIsPreparingAttachments(true);
                        setAttachments(null);

                        let data = { svg: null, json: null }

                        if (svgAttachmentId) {
                            const attachmentSvg = await wp.media.attachment(svgAttachmentId).fetch();
                            if (attachmentSvg && attachmentSvg.url) {
                                data.svg = attachmentSvg.url;
                            } else {
                                throw new Error();
                            }
                        }

                        if (jsonAttachmentId) {
                            const attachmentJson = await wp.media.attachment(jsonAttachmentId).fetch();
                            if (attachmentJson && attachmentJson.url) {
                                data.json = attachmentJson.url;
                            } else {
                                throw new Error();
                            }
                        }

                        setAttachments(data);
                    } catch {
                        const label = icon ? `${icon.family}-${icon.style}-${icon.index}-${icon.name}` : __('Icon', 'lordicon');
                        setMessagePreview(__(`Icon unavailable: ${label}. Edit this block and choose a new icon.`, 'lordicon'));
                    } finally {
                        setIsPreparingAttachments(false);
                    }
                }
            };

            loadData();
        }, [icon, svgAttachmentId, jsonAttachmentId]);

        useEffect(() => {
            if (!isInEditor) return;

            if (icon) {
                const loadData = async () => {
                    try {
                        setIsLoadingJson(true);

                        const response = await DI.httpService.request(
                            'icons',
                            {
                                family: icon.family,
                                style: icon.style,
                                index: icon.index,
                            },
                        );

                        const responseIcon = response?.icons?.[0];

                        const iconData = responseIcon ? await loadIconData({
                            ...icon,
                            srcPreview: responseIcon.files.preview,
                            srcJson: responseIcon.files.json,
                            srcSvg: responseIcon.files.svg,
                        }) : { ...icon };

                        setSelectedIcon(iconData);
                    } catch (error) {
                        console.error('Error loading icon data:', error);
                        return;
                    } finally {
                        setIsLoadingJson(false);
                    }
                };

                loadData();
            }
        }, [icon, isInEditor]);

        useIconSelected((selectedIcon) => {
            if (!isInEditor) return;

            if (selectedIcon) {
                setSelectedIcon(selectedIcon);
            }
        });

        useIconExported((params) => {
            if (!isInEditor) return;

            const newAttributes = {};

            // The upload endpoint answers with whatever attachments already exist for this
            // icon in this post, so choosing the SVG format can come back carrying the JSON
            // id from an earlier insert of the same icon. `render_block()` prefers JSON
            // whenever an id is present, which would quietly override the chosen format.
            const jsonId = params.properties?.format === 'svg' ? 0 : params.jsonAttachmentId;

            if (jsonId !== jsonAttachmentId) {
                newAttributes.jsonAttachmentId = jsonId;
            }

            if (params.svgAttachmentId !== svgAttachmentId) {
                newAttributes.svgAttachmentId = params.svgAttachmentId;
            }

            if (JSON.stringify(params.icon) !== JSON.stringify(icon)) {
                newAttributes.icon = params.icon;
            }

            if (JSON.stringify(params.properties) !== JSON.stringify(properties)) {
                newAttributes.properties = params.properties;
            }

            setAttributes(newAttributes);
        });

        useShowLibrary(() => {
            if (!isInEditor) return;

            setSelectedIcon(null);
        });

        useLogin(() => {
            window.location.href = '/wp-admin/admin.php?page=lordicon-settings';
        });

        const size = `${properties?.size || DEFAULT_SIZE}px`;
        const stroke = properties?.stroke || DEFAULT_STROKE;
        const format = properties?.format || DEFAULT_FORMAT;
        const state = properties?.state || null;
        const colors = handleColors(properties?.colors);
        const speed = Math.round(100 * (properties?.speed ?? 1)) / 100;
        const target = properties?.target || null;
        const sequence = properties?.sequence || null;
        const trigger = sequence ? 'sequence' : handleTrigger(state);
        const intro = properties?.intro || undefined;
        const clickToReplay = intro || trigger === 'in';

        const editorPart = (
            <>
                <InspectorControls>
                    {isPreparingAttachments || isLoadingJson || selectedIcon ? (
                        <li-editor-page ref={editorPageRef}></li-editor-page>
                    ) : (
                        <li-library-page></li-library-page>
                    )}
                </InspectorControls>
                <InspectorAdvancedControls>
                    <SelectControl
                        label={__('Display Type', 'lordicon')}
                        value={properties?.display || 'block'}
                        options={[
                            { label: __('Block', 'lordicon'), value: 'block' },
                            { label: __('Inline Block', 'lordicon'), value: 'inline-block' },
                        ]}
                        onChange={(value) => {
                            const newProperties = properties || {};
                            setAttributes({
                                properties: {
                                    ...newProperties,
                                    display: value
                                }
                            });
                        }}
                        help={__('Controls how the icon behaves in the layout.', 'lordicon')}
                    />
                    {format === 'json' ? (
                        <TextControl
                            label={__('Target', 'lordicon')}
                            value={target || ''}
                            onChange={(value) => {
                                const newProperties = properties || {};
                                setAttributes({
                                    properties: {
                                        ...newProperties,
                                        target: value || null
                                    }
                                });
                            }}
                            help={__('Query selector for the element on which events will be listened.', 'lordicon')}
                        />
                    ) : null}
                </InspectorAdvancedControls>
            </>
        );

        const previewPart = (
            <div {...blockProps}>
                {
                    isPreparingAttachments ? (
                        <div className={`lordicon-wrapper${properties?.display === 'inline-block' ? ' lordicon-wrapper-inline-block' : ''}`}>
                            <div className="lordicon-busy" style={{ width: size, height: size }}>
                                <li-spinner></li-spinner>
                            </div>
                        </div>
                    ) : format === 'json' && attachments?.json ? (
                        <div className={`lordicon-wrapper${properties?.display === 'inline-block' ? ' lordicon-wrapper-inline-block' : ''}`}>
                            <lord-icon
                                ref={canvasIconRef}
                                style={{ width: size, height: size }}
                                src={attachments.json}
                                stroke={stroke}
                                state={state}
                                colors={colors}
                                trigger={trigger}
                                target={target}
                                speed={speed}
                                sequence={sequence}
                                intro={intro === undefined ? undefined : ''}
                                click-to-replay={clickToReplay}
                            >
                            </lord-icon>
                        </div>
                    ) : format === 'svg' && attachments?.svg ? (
                        <div className={`lordicon-wrapper${properties?.display === 'inline-block' ? ' lordicon-wrapper-inline-block' : ''}`}>
                            <img
                                alt=""
                                style={{ width: size, height: size }}
                                src={attachments.svg}
                            />
                        </div>
                    ) : (
                        <div className="lordicon-info">
                            <p>{messagePreview}</p>
                        </div>
                    )
                }
            </div>
        );

        return (
            <>
                {editorPart}
                {previewPart}
            </>
        );
    },
});