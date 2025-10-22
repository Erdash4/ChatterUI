module.exports = {
    root: true,
    extends: [
        'universe/native',
        'universe/shared/typescript-analysis',
        'plugin:prettier/recommended',
    ],
    plugins: ['import', 'eslint-plugin-react-compiler', 'internal', 'prettier'],
    overrides: [
        {
            files: ['*.ts', '*.tsx', '*.d.ts', '*.js', '*.jsx'],
            parserOptions: {
                project: './tsconfig.json',
            },
        },
    ],
    rules: {
        'react-compiler/react-compiler': 'error',
        'prettier/prettier': [
            'warn',
            {
                usePrettierrc: true,
            },
        ],
        radix: 'off',
        'no-unused-vars': 'warn',
        '@typescript-eslint/no-unused-vars': 'off',
        'object-shorthand': ['warn', 'consistent'],
        'import/order': [
            'warn',
            {
                alphabetize: { order: 'asc', caseInsensitive: true },
                groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
                'newlines-between': 'always',
            },
        ],
    },
}
