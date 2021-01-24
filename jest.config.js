module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    displayName: 'reactivity',
    verbose: true,
    
    collectCoverage: true,

    coverageDirectory: 'tests/__coverage__',
    bail: 0,
    globals: {
        __DEV__: true,
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },

    watchPathIgnorePatterns: [
        "dist",
        "node_modules",
        "script",
    ],
    testMatch: [
        '**/tests/*.test.ts',
        '**/tests/object.define/*.test.ts',
    ]
};