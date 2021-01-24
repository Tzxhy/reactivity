
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import cleanup from 'rollup-plugin-cleanup';
import clear from 'rollup-plugin-clear'

export default {
    input: 'src/index.ts',
    output: [
        {
            file: './dist/reactivity.es.js',
            format: 'es',
        },
    ],
    plugins: [
        
        commonjs(),
        typescript({
            tsconfigOverride: {
                exclude: ['tests/**/*']
            },
            abortOnError: false,
        }),
        cleanup(),
        clear({
            targets: ['./dist'],
        }),
    ],
};