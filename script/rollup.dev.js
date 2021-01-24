import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import base from './rollup.base';

export default {
    ...base,
    output: [
        ...base.output,
        {
            file: './dist/index.cjs.js',
            format: 'cjs',
            name: 'reactivity',
        },
    ],
    plugins: [
        nodeResolve({
            extensions: ['.js', '.ts'],
        }),
        ...base.plugins,
        replace({
            __DEV__: true,
        }),
    ],
}
