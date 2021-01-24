
import replace from '@rollup/plugin-replace';
import base from './rollup.base';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { uglify } from 'rollup-plugin-uglify';
import babel from '@rollup/plugin-babel'

export default [
    {
        ...base,
        plugins: [
            nodeResolve({
                extensions: ['.js', '.ts'],
                modulesOnly: true,
            }),
            ...base.plugins,
            
            babel({
                babelHelpers: 'bundled',
            }),
            replace({
                __DEV__: false,
            }),
        ],
    }, 
    {
    ...base,
    output: [
        {
            file: './dist/reactivity.umd.js',
            format: 'umd',
            name: 'reactivity',
        },
    ],
    plugins: [
        nodeResolve({
            extensions: ['.js', '.ts'],
        }),
        ...base.plugins,
        babel({
            babelHelpers: 'bundled',
        }),
        replace({
            __DEV__: false,
        }),
        uglify({
            sourcemap: true,
        }),
    ],
}]
