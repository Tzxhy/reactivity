module.exports = {
    presets: [
        [
            '@babel/preset-env', {
                targets: 'defaults',
                useBuiltIns: 'usage',
                corejs: '3.8',
            },
        ],
    ],
    exclude: [
        /\/core-js\//,
        /node_modules\//,
    ],
    
};
