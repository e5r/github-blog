//import pkg from './package.json'
//import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
//import { uglify } from 'rollup-plugin-uglify'

const plugins = [
    //babel({ exclude: 'node_modules/**' }),
    nodeResolve(),
    commonjs(),
]

export default [
    {
        plugins: plugins,
        input: './lib/main.js',
        output: {
            file: 'wwwroot/lib/js/github-blog.umd.js',
            format: 'umd',
            name: 'GithubBlog'
        }
    }
]
