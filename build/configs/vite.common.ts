import vue from '@vitejs/plugin-vue';
import { optimizeLodashImports } from '@optimize-lodash/rollup-plugin';
import { lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { RollupOptions } from 'rollup';
import { visualizer } from 'rollup-plugin-visualizer';
import { type InlineConfig } from 'vite';

export type BuildFormat = 'es' | 'mjs' | 'cjs' | 'iife';

export const resolve = {
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
    '~/': path.resolve(process.cwd(), 'src'),
  },
};

export const readDirRecursive = (path: string): string[] => {
  return readdirSync(path).reduce<string[]>((acc, entry) => {
    const p = `${path}/${entry}`;
    if (lstatSync(p).isDirectory()) {
      return [...acc, ...readDirRecursive(p)];
    }
    return [...acc, p];
  }, []);
};

const rollupCommonOptions: RollupOptions = {
  external: ['vue', 'lodash', 'date-fns', 'date-fns-tz', '@floating-ui/dom'],
  output: {
    // Provide global variables to use in the UMD build
    // for externalized deps
    globals: {
      '@floating-ui/dom': 'FloatingUIDOM',
      'date-fns': 'dateFns',
      'lodash': '_',
      'date-fns-tz': 'dateFnsTz',
      'vue': 'Vue',
    },
  },
};

const rollupMjsBuildOptions: RollupOptions = {
  input: path.resolve(process.cwd(), 'src/index.ts'),
  external: rollupCommonOptions.external,
  output: {
    sourcemap: true,
    dir: 'dist/mjs',
    format: 'esm',
    entryFileNames: '[name].mjs',
    chunkFileNames: '[name].mjs',
    assetFileNames: '[name].[ext]',
  },
};

const rollupEsmBuildOptions: RollupOptions = {
  external: rollupCommonOptions.external,
  output: {
    format: 'esm',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js',
    assetFileNames: '[name].[ext]',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
};

export function createViteConfig(format: BuildFormat): InlineConfig {
  const isEs = format === 'es';
  const isEsm = ['es', 'mjs'].includes(format);
  const isNode = format === 'mjs';
  const useTerser = format === 'iife';

  let rollupOptions: RollupOptions;
  switch(format) {
    case 'es':
      rollupOptions = rollupEsmBuildOptions;
      break;
    case 'mjs':
      rollupOptions = rollupMjsBuildOptions;
      break;
    default:
      rollupOptions = rollupCommonOptions;
  }

  const config: InlineConfig = {
    resolve,
    build: {
      outDir: `dist/${format}`,
      cssCodeSplit: !isEsm,
      sourcemap: true,
      lib: {
        entry: path.resolve(process.cwd(), 'src/index.ts'),
        fileName: () => 'index.js',
        formats: [isNode ? 'es' : format],
        // Only for iife/umd
        name: 'VCalendar',
      },
      rollupOptions,
      // default esbuild, not available for esm format in lib mode
      minify: useTerser ? 'terser' : false,
      terserOptions: useTerser
        ? {
            // https://stackoverflow.com/questions/57720816/rails-webpacker-terser-keep-fnames
            // disable mangling class names (for vue class component)
            keep_classnames: true,
            // disable mangling functions names
            keep_fnames: true,
          }
        : undefined,
    },
    plugins: [
      vue({
        isProduction: true,
        exclude: [/\.md$/, /\.spec\.ts$/, /\.spec\.disabled$/],
      }),
      optimizeLodashImports(),
    ],
  };

  // Add visualizer for es build
  if (isEs) {
    config.plugins!.push(
      visualizer({
        filename: 'dist/stats.html',
        title: 'V-Calendar Visualizer',
      }),
    );
  }

  return config;
}
