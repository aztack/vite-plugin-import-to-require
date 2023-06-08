import type { Plugin } from 'vite';
export declare const nodeBuiltinModules: Set<string>;
export interface ImportToRequireOption {
    debug: boolean;
    namespace: string;
    transformAll: boolean;
}
export declare const defaultImportToRequireOption: {
    debug: boolean;
    namespace: string;
    transformAll: boolean;
};
export declare function importToRequirePlugin(options?: ImportToRequireOption): Plugin;
