
export enum ControlType {
    NONE = 'None',
    POSITIVE = 'Positive',
    NEGATIVE = 'Negative',
    BLANK = 'Blank',
}

export enum PlateView {
    COMPOUND = 'Compound',
    CONCENTRATION = 'Concentration',
    CONTROL = 'Control',
    REPLICATE = 'Replicate',
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    PUBLICATION = 'publication',
}

export type ConcentrationUnit = 'molar' | 'mass';

export interface Well {
    id: string; // e.g., "A1"
    compound: string;
    concentration: number; // ALWAYS in µM
    mw: number; // Molecular Weight in g/mol
    strain: string;
    controlType: ControlType;
    replicateGroup: number;
}

export interface PlateFormat {
    rows: number;
    cols: number;
    rowLabels: string[];
    colLabels: string[];
}

export interface CheckerboardConfig {
    drugAName: string;
    drugBName: string;
    maxConcA: number;
    maxConcB: number;
    factor: number;
    colorA: string;
    colorB: string;
    mwA: number;
    mwB: number;
}