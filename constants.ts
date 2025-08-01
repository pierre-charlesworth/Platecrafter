
import { PlateFormat } from './types';

export const PLATE_96_WELL: PlateFormat = {
    rows: 8,
    cols: 12,
    rowLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    colLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
};

export const CONCENTRATION_COLOR_SCALE = [
    '#ffffd9',
    '#edf8b1',
    '#c7e9b4',
    '#7fcdbb',
    '#41b6c4',
    '#1d91c0',
    '#225ea8',
    '#253494',
    '#081d58',
];

export const PUBLICATION_COLOR_SCALE = [
    '#ffffff',
    '#f0f0f0',
    '#d9d9d9',
    '#bdbdbd',
    '#969696',
    '#737373',
    '#525252',
    '#252525',
    '#000000',
];

export const CONTROL_COLORS: { [key: string]: string } = {
    Positive: 'bg-green-500',
    Negative: 'bg-red-500',
    Blank: 'bg-gray-300 dark:bg-gray-600',
    None: '',
};

export const REPLICATE_COLORS: string[] = [
    'border-sky-500',
    'border-emerald-500',
    'border-amber-500',
    'border-violet-500',
    'border-pink-500',
    'border-cyan-500',
    'border-lime-500',
    'border-rose-500',
];

// New colors for exporting image
export const COMPOUND_COLORS = [
    '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c',
    '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928',
    '#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
    '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'
];
