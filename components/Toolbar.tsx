
import React from 'react';
import { PlateView, Theme, Well, ConcentrationUnit } from '../types';
import { SunIcon, MoonIcon, BookOpenIcon, TableCellsIcon, EyeIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, DocumentArrowDownIcon, PhotoIcon } from './icons/Icons';
import { exportPlateToPng } from '../services/exportService';
import { PLATE_96_WELL } from '../constants';

interface ToolbarProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    view: PlateView;
    setView: (view: PlateView) => void;
    showTable: boolean;
    setShowTable: (show: boolean) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    plateData: Well[];
    concentrationUnit: ConcentrationUnit;
}

const Toolbar: React.FC<ToolbarProps> = ({ theme, setTheme, view, setView, showTable, setShowTable, undo, redo, canUndo, canRedo, plateData, concentrationUnit }) => {
    
    const handleJsonExport = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(plateData, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "platecrafter_layout.json";
        link.click();
    };

    const handleImageExport = () => {
        exportPlateToPng(plateData, PLATE_96_WELL, concentrationUnit);
    };

    const IconButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; tooltip: string }> = ({ onClick, disabled, children, tooltip }) => (
        <div className="relative group">
            <button
                onClick={onClick}
                disabled={disabled}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {children}
            </button>
            <span className="absolute top-full mt-2 w-max p-1 px-2 text-xs bg-gray-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                {tooltip}
            </span>
        </div>
    );

    return (
        <header className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center space-x-2">
                <img src="https://picsum.photos/40/40" alt="logo" className="w-8 h-8 rounded-full" />
                <h1 className="text-xl font-bold text-sciblue-700 dark:text-sciblue-300">PlateCrafter</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
                <IconButton onClick={undo} disabled={!canUndo} tooltip="Undo (Ctrl+Z)"><ArrowUturnLeftIcon /></IconButton>
                <IconButton onClick={redo} disabled={!canRedo} tooltip="Redo (Ctrl+Y)"><ArrowUturnRightIcon /></IconButton>
                
                <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
                
                <select value={view} onChange={e => setView(e.target.value as PlateView)} className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-sciblue-500 focus:border-sciblue-500 text-sm">
                    {Object.values(PlateView).map(v => <option key={v} value={v}>{v}</option>)}
                </select>

                <IconButton onClick={() => setShowTable(!showTable)} tooltip={showTable ? 'Show Plate View' : 'Show Data Table'}>
                    {showTable ? <EyeIcon /> : <TableCellsIcon />}
                </IconButton>
                
                <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
                
                <IconButton onClick={() => setTheme(Theme.LIGHT)} tooltip="Light Theme">{theme === Theme.LIGHT && <span className="absolute -top-1 -right-1 w-2 h-2 bg-sciblue-500 rounded-full"></span>}<SunIcon /></IconButton>
                <IconButton onClick={() => setTheme(Theme.DARK)} tooltip="Dark Theme">{theme === Theme.DARK && <span className="absolute -top-1 -right-1 w-2 h-2 bg-sciblue-500 rounded-full"></span>}<MoonIcon /></IconButton>
                <IconButton onClick={() => setTheme(Theme.PUBLICATION)} tooltip="Publication Theme">{theme === Theme.PUBLICATION && <span className="absolute -top-1 -right-1 w-2 h-2 bg-sciblue-500 rounded-full"></span>}<BookOpenIcon /></IconButton>
                
                <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-2"></div>

                <IconButton onClick={handleImageExport} tooltip="Export to Image (PNG)"><PhotoIcon /></IconButton>
                <IconButton onClick={handleJsonExport} tooltip="Export Layout (JSON)"><DocumentArrowDownIcon /></IconButton>
            </div>
        </header>
    );
};

export default Toolbar;