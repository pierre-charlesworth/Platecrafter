
import { ConcentrationUnit, PlateFormat, Well, CheckerboardConfig } from './types';
import { PLATE_96_WELL } from './constants';

/**
 * Formats a concentration value, automatically switching to smaller units
 * for small numbers to maintain precision.
 * @param value The numeric value to format.
 * @param unit The base unit ('µM' or 'µg/mL').
 * @returns A formatted string like "1.23 µM" or "5.00 nM".
 */
const formatValueWithUnit = (value: number, unit: 'µM' | 'µg/mL'): string => {
    if (value <= 0) return '';

    const unitsMolar = ['µM', 'nM', 'pM'];
    const unitsMass = ['µg/mL', 'ng/mL', 'pg/mL'];
    const selectedUnits = unit === 'µM' ? unitsMolar : unitsMass;
    
    let displayValue = value;
    let unitIndex = 0;
    
    // Switch to smaller units if value is less than 1, down to the smallest unit in our list
    while (displayValue > 0 && displayValue < 1 && unitIndex < selectedUnits.length - 1) {
        displayValue *= 1000;
        unitIndex++;
    }

    return `${displayValue.toFixed(2)} ${selectedUnits[unitIndex]}`;
}

/**
 * Formats a concentration stored in µM for display in various units.
 * @param valueInUm The concentration value in µM.
 * @param mw The molecular weight (g/mol) of the compound.
 * @param displayUnit The desired display unit system ('molar' or 'mass').
 * @returns A formatted string representing the concentration.
 */
export const formatConcentration = (valueInUm: number, mw: number, displayUnit: ConcentrationUnit): string => {
    if (valueInUm <= 0) return '';
    
    if (displayUnit === 'molar') {
        return formatValueWithUnit(valueInUm, 'µM');
    } else { // 'mass'
        if (mw <= 0) return 'N/A';
        const valueInUgPerMl = (valueInUm * mw) / 1000;
        return formatValueWithUnit(valueInUgPerMl, 'µg/mL');
    }
};

/**
 * Gets a contrasting text color (black or white) for a given hex background color.
 * @param hexColor The background color in hex format (e.g., '#RRGGBB').
 * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds.
 */
export const getContrastingTextColor = (hexColor: string): string => {
    if (!hexColor || !hexColor.startsWith('#')) return '#000000';
    
    const hex = hexColor.slice(1);
    const r = parseInt(hex.length === 3 ? hex.charAt(0).repeat(2) : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.charAt(1).repeat(2) : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.charAt(2).repeat(2) : hex.substring(4, 6), 16);
    
    // Formula for luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Converts a concentration value from mass/volume (µg/mL) to molar (µM).
 * @param valueInUgPerMl The value in µg/mL.
 * @param mw The molecular weight (g/mol).
 * @returns The concentration value in µM.
 */
export const convertMassToMolar = (valueInUgPerMl: number, mw: number): number => {
    if (mw <= 0) return 0;
    return (valueInUgPerMl * 1000) / mw; // returns µM
}

/**
 * Converts a concentration value from molar (µM) to mass/volume (µg/mL).
 * @param valueInUm The value in µM.
 * @param mw The molecular weight (g/mol).
 * @returns The concentration value in µg/mL.
 */
export const convertMolarToMass = (valueInUm: number, mw: number): number => {
    if (mw <= 0) return 0;
    return (valueInUm * mw) / 1000; // returns µg/mL
}

/**
 * Gets the range of well IDs between a start and end well, inclusive.
 * Only works for wells in a single row or column.
 * @param startId The ID of the starting well (e.g., "A1").
 * @param endId The ID of the ending well (e.g., "A6").
 * @returns An array of well IDs, or null if the selection is diagonal.
 */
export const getWellRange = (startId: string, endId: string): string[] | null => {
    const { rowLabels, colLabels }: PlateFormat = PLATE_96_WELL;

    const parseId = (id: string) => {
        const row = id.charAt(0);
        const col = id.substring(1);
        return {
            row,
            col,
            rowIndex: rowLabels.indexOf(row),
            colIndex: colLabels.indexOf(col),
        };
    };

    const start = parseId(startId);
    const end = parseId(endId);

    if (start.rowIndex === -1 || start.colIndex === -1 || end.rowIndex === -1 || end.colIndex === -1) {
        return null; // Invalid ID
    }

    const wells: string[] = [];

    // Horizontal (same row)
    if (start.rowIndex === end.rowIndex) {
        const row = start.row;
        const step = start.colIndex < end.colIndex ? 1 : -1;
        for (let i = start.colIndex; ; i += step) {
            wells.push(`${row}${colLabels[i]}`);
            if (i === end.colIndex) break;
        }
        return wells;
    }

    // Vertical (same column)
    if (start.colIndex === end.colIndex) {
        const col = start.col;
        const step = start.rowIndex < end.rowIndex ? 1 : -1;
        for (let i = start.rowIndex; ; i += step) {
            wells.push(`${rowLabels[i]}${col}`);
            if (i === end.rowIndex) break;
        }
        return wells;
    }

    return null; // Not a straight line (diagonal)
};

// --- Color Manipulation Utilities for Checkerboard ---

type RGB = { r: number; g: number; b: number };

const hexToRgb = (hex: string): RGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
};

const mixRgbColors = (rgb1: RGB, rgb2: RGB, weight: number = 0.5): RGB => {
    const w1 = 1 - weight;
    const r = Math.round(rgb1.r * w1 + rgb2.r * weight);
    const g = Math.round(rgb1.g * w1 + rgb2.g * weight);
    const b = Math.round(rgb1.b * w1 + rgb2.b * weight);
    return { r, g, b };
};

const interpolateRgb = (startRgb: RGB, endRgb: RGB, factor: number): RGB => {
    const r = Math.round(startRgb.r + factor * (endRgb.r - startRgb.r));
    const g = Math.round(startRgb.g + factor * (endRgb.g - startRgb.g));
    const b = Math.round(startRgb.b + factor * (endRgb.b - startRgb.b));
    return { r, g, b };
};

const BASE_INTENSITY = 0.25; // Set a base intensity so even low concs are visible

/**
 * Remaps a raw intensity (0 to 1) to a new scale that starts at a base level.
 * @param intensity The raw intensity (0-1).
 * @returns The adjusted intensity.
 */
const getAdjustedIntensity = (intensity: number): number => {
    if (intensity <= 0) return 0;
    // Map the intensity from [0, 1] to [BASE_INTENSITY, 1]
    return BASE_INTENSITY + (1 - BASE_INTENSITY) * intensity;
};

export const calculateCheckerboardWellColor = (well: Well, config: CheckerboardConfig, plateFormat: PlateFormat): string | null => {
    const colIndex = parseInt(well.id.substring(1), 10) - 1;

    let concA = 0;
    let concB = 0;

    const emptyColorRgb = { r: 255, g: 255, b: 255 };
    const colorARgb = hexToRgb(config.colorA);
    const colorBRgb = hexToRgb(config.colorB);

    if (!colorARgb || !colorBRgb) return null;

    // Determine concentrations of A and B in the current well
    if (well.compound === config.drugAName) {
        concA = well.concentration;
    } else if (well.compound === config.drugBName) {
        concB = well.concentration;
    } else if (well.compound === `${config.drugAName} + ${config.drugBName}`) {
        concA = well.concentration; // Drug A conc is stored in the primary field
        // Infer Drug B's concentration from its column position
        const exponent = (plateFormat.colLabels.length - 1) - colIndex;
        concB = config.maxConcB / Math.pow(config.factor, exponent);
    } else {
        return null; // Not a part of the main checkerboard assay drugs (e.g., control)
    }

    const rawIntensityA = config.maxConcA > 0 ? concA / config.maxConcA : 0;
    const rawIntensityB = config.maxConcB > 0 ? concB / config.maxConcB : 0;
    
    if (rawIntensityA <= 0 && rawIntensityB <= 0) return null;

    const adjustedIntensityA = getAdjustedIntensity(rawIntensityA);
    const adjustedIntensityB = getAdjustedIntensity(rawIntensityB);

    if (rawIntensityA > 0 && rawIntensityB > 0) {
        // Mix colors for combination wells
        const finalColorA = interpolateRgb(emptyColorRgb, colorARgb, adjustedIntensityA);
        const finalColorB = interpolateRgb(emptyColorRgb, colorBRgb, adjustedIntensityB);
        const mixedRgb = mixRgbColors(finalColorA, finalColorB, 0.5);
        return rgbToHex(mixedRgb.r, mixedRgb.g, mixedRgb.b);
    } else if (rawIntensityA > 0) {
        const finalRgb = interpolateRgb(emptyColorRgb, colorARgb, adjustedIntensityA);
        return rgbToHex(finalRgb.r, finalRgb.g, finalRgb.b);
    } else if (rawIntensityB > 0) {
        const finalRgb = interpolateRgb(emptyColorRgb, colorBRgb, adjustedIntensityB);
        return rgbToHex(finalRgb.r, finalRgb.g, finalRgb.b);
    }

    return null;
};
