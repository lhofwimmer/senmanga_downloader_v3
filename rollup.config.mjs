import nodeResolve from "@rollup/plugin-node-resolve";

export default {
    input: 'src/background.js',
    output: {
        name: 'main',
        file: "build/main.js",
        format: 'iife'
    },
    plugins: [nodeResolve()]
}
