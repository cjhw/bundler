import * as magic_string from 'magic-string';
export * from 'ast-parser';

interface RollupOptions {
    input: string;
    output: string;
}
declare function rollup(options: RollupOptions): Promise<{
    generate: () => {
        code: string;
        map: magic_string.SourceMap;
    };
    write: () => Promise<[unknown, unknown]>;
}>;

export { type RollupOptions, rollup };
