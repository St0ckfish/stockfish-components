import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  external: ['react', 'react-dom'],
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    postcss({
      extract: 'index.css',
      minimize: true,
      inject: false,
    }),
    typescript({
      typescript: await import('typescript').then(ts => ts.default),
      tsconfig: 'tsconfig.build.json',
    }),
  ],
};
