module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
    ],
    // "import/extensions": [{
    //     ts: 'never'
    // }],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
    ],
    rules: {
        '@typescript-eslint/indent': ['error', 4],
        indent: ['error', 4],
        'no-console': 0,
    },
};
