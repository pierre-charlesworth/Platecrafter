
import React from 'react';
import { Well, PlateView, Theme, ControlType, ConcentrationUnit, PlateFormat, CheckerboardConfig } from '../types';
import { CONCENTRATION_COLOR_SCALE, PUBLICATION_COLOR_SCALE, CONTROL_COLORS, REPLICATE_COLORS } from '../constants';
import { formatConcentration, calculateCheckerboardWellColor } from '../utils.js';

interface WellComponentProps {
    well: Well;
    isSelected: boolean;
    onClick: (event: React.MouseEvent) => void;
    view: PlateView;
    theme: Theme;
    maxConcentration: number;
    concentrationUnit: ConcentrationUnit;
    plateFormat: PlateFormat;
    checkerboardConfig: CheckerboardConfig | null;
}

const WellComponent: React.FC<WellComponentProps> = ({ well, isSelected, onClick, view, theme, maxConcentration, concentrationUnit, plateFormat, checkerboardConfig }) => {
    
    let style: React.CSSProperties = {};
    let bgClass = 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';

    if (view === PlateView.CONCENTRATION && checkerboardConfig) {
        const checkerboardColor = calculateCheckerboardWellColor(well, checkerboardConfig, plateFormat);
        if (checkerboardColor) {
            style.backgroundColor = checkerboardColor;
            bgClass = '';
        }
    } else if (view === PlateView.CONTROL) {
        const controlClass = CONTROL_COLORS[well.controlType];
        if (controlClass) {
            bgClass = controlClass;
        }
    } else if (view === PlateView.CONCENTRATION && well.concentration > 0 && maxConcentration > 0) {
        const scale = theme === Theme.PUBLICATION ? PUBLICATION_COLOR_SCALE : CONCENTRATION_COLOR_SCALE;
        const ratio = well.concentration / maxConcentration;
        const index = Math.min(Math.floor(ratio * scale.length), scale.length - 1);
        style.backgroundColor = scale[index];
        bgClass = ''; // Don't use default bg class if we have a specific color
    }
    
    const baseClasses = "w-10 h-10 lg:w-12 lg:h-12 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-mono border-4";

    let borderClass;
    if (isSelected) {
        borderClass = 'border-sciblue-500';
    } else if (view === PlateView.REPLICATE && well.replicateGroup > 0) {
        borderClass = REPLICATE_COLORS[(well.replicateGroup - 1) % REPLICATE_COLORS.length];
    } else {
        borderClass = 'border-transparent';
    }

    const transformClass = isSelected ? 'scale-105' : 'scale-100';

    const getWellContent = () => {
        switch (view) {
            case PlateView.COMPOUND:
                return well.compound.substring(0, 3) || '-';
            case PlateView.CONCENTRATION:
                // Format with auto-scaling units (e.g., nM, pM) and 2 decimal places.
                return formatConcentration(well.concentration, well.mw, concentrationUnit).split(' ')[0] || '';
            case PlateView.CONTROL:
                return well.controlType !== ControlType.NONE ? well.controlType.charAt(0) : '';
            case PlateView.REPLICATE:
                return well.replicateGroup > 0 ? `R${well.replicateGroup}`: '';
            default:
                return '';
        }
    };
    
    const renderTooltipContent = () => {
        let compoundLine = <p>Compound: {well.compound || 'N/A'}</p>;
        let concentrationLine = <p>Conc: {formatConcentration(well.concentration, well.mw, concentrationUnit) || '0'}</p>;
        let mwLine = <p>MW: {well.mw > 0 ? `${well.mw} g/mol` : 'N/A'}</p>;

        if (checkerboardConfig && well.compound.includes(' + ')) {
            const colIndex = plateFormat.colLabels.indexOf(well.id.substring(1));
            const exponent = (plateFormat.colLabels.length - 1) - colIndex;
            const concB_uM = checkerboardConfig.maxConcB / Math.pow(checkerboardConfig.factor, exponent);

            const formattedConcA = formatConcentration(well.concentration, checkerboardConfig.mwA, concentrationUnit);
            const formattedConcB = formatConcentration(concB_uM, checkerboardConfig.mwB, concentrationUnit);

            compoundLine = <p>Compound: {well.compound}</p>;
            concentrationLine = (
                <>
                    <p>Conc ({checkerboardConfig.drugAName}): {formattedConcA || '0'}</p>
                    <p>Conc ({checkerboardConfig.drugBName}): {formattedConcB || '0'}</p>
                </>
            );
            mwLine = (
                <>
                    <p>MW ({checkerboardConfig.drugAName}): {checkerboardConfig.mwA > 0 ? `${checkerboardConfig.mwA} g/mol` : 'N/A'}</p>
                    <p>MW ({checkerboardConfig.drugBName}): {checkerboardConfig.mwB > 0 ? `${checkerboardConfig.mwB} g/mol` : 'N/A'}</p>
                </>
            );
        }

        return (
            <>
                <p className="font-bold">{well.id}</p>
                {compoundLine}
                {concentrationLine}
                {mwLine}
                <p>Strain: {well.strain || 'N/A'}</p>
                <p>Control: {well.controlType}</p>
                <p>Replicate: {well.replicateGroup || 'N/A'}</p>
            </>
        );
    };

    const rowIndex = plateFormat.rowLabels.indexOf(well.id.charAt(0));
    const colIndex = plateFormat.colLabels.indexOf(well.id.substring(1));

    const tooltipClasses = [
        'absolute', 'z-10', 'w-max', 'max-w-xs', 'p-2', 'text-sm', 'bg-gray-800', 'text-white', 'rounded-md',
        'opacity-0', 'group-hover:opacity-100', 'transition-opacity', 'duration-300', 'pointer-events-none'
    ];

    if (rowIndex < 2) {
        tooltipClasses.push('top-full', 'mt-2');
    } else {
        tooltipClasses.push('bottom-full', 'mb-2');
    }

    if (colIndex < 2) {
        tooltipClasses.push('left-0');
    } else if (colIndex > plateFormat.cols - 4) {
        tooltipClasses.push('right-0');
    } else {
        tooltipClasses.push('left-1/2', '-translate-x-1/2');
    }


    return (
        <div className="relative group flex items-center justify-center">
            <div
                style={style}
                className={`${baseClasses} ${bgClass} ${borderClass} ${transformClass}`}
                onClick={onClick}
            >
                <span className="text-gray-800 dark:text-gray-200 pointer-events-none">{getWellContent()}</span>
            </div>
            <div className={tooltipClasses.join(' ')}>
                {renderTooltipContent()}
            </div>
        </div>
    );
};

export default WellComponent;