declare const __ENVIRONMENT__: 'BLOCK' | 'SETTINGS';
declare const __APP__: string;
declare const __TITLE__: string;
declare const __WEBSITE__: string;
declare const __SUPPORT_DARK__: boolean;
declare const __SUPPORT_NEW_TAB__: boolean;
declare const __LORDICON__: {
    url: string,
    context: 'editor' | 'settings',
    nonce: string,
    status: any,
    variants: any,
    postId?: number,
};

declare module '*?raw' {
    const content: string;
    export default content;
}

declare module '*?url' {
    const content: string;
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}
