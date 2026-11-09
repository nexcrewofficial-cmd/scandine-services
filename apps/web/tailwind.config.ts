import type { Config } from 'tailwindcss';
import { scanAndDinePreset } from '@scan-and-dine/ui-components';

const config: Config = {
  presets: [scanAndDinePreset as any],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
