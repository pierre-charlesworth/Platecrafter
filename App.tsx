
import React, { useState, useEffect, useMemo } from 'react';
import { PlateView, Theme, Well, ConcentrationUnit } from './types';
import { usePlateState } from './hooks/usePlateState';
import PlateGrid from './components/PlateGrid';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import DataTable from './components/DataTable';
import { PLATE_96_WELL } from './constants';

const App: React.FC = () => {
    const { 
        plateData, 
        selectedWells, 
        undo, 
        redo, 
        canUndo, 
        canRedo, 
        updateWell, 
        updateMultipleWells,
        batchUpdateWells,
        handleSelectWell,
        clearSelection,
        setPlateData
    } = usePlateState(PLATE_96_WELL);

    const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
    const [view, setView] = useState<PlateView>(PlateView.CONCENTRATION);
    const [showTable, setShowTable] = useState<boolean>(false);
    const [concentrationUnit, setConcentrationUnit] = useState<ConcentrationUnit>('molar');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(Theme.LIGHT, Theme.DARK, Theme.PUBLICATION);
        root.classList.add(theme);
        if (theme === Theme.DARK) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const selectedWellData = useMemo(() => {
        if (selectedWells.length === 0) return [];
        return selectedWells.map(id => plateData.find(w => w.id === id)).filter(Boolean) as Well[];
    }, [selectedWells, plateData]);

    return (
        <div className={`flex flex-col h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 theme-${theme}`}>
            <Toolbar
                theme={theme}
                setTheme={setTheme}
                view={view}
                setView={setView}
                showTable={showTable}
                setShowTable={setShowTable}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                plateData={plateData}
                concentrationUnit={concentrationUnit}
            />
            <main className="flex flex-1 overflow-hidden">
                <Sidebar
                    selectedWells={selectedWellData}
                    updateMultipleWells={updateMultipleWells}
                    batchUpdateWells={batchUpdateWells}
                    setPlateData={setPlateData}
                    clearSelection={clearSelection}
                    concentrationUnit={concentrationUnit}
                    setConcentrationUnit={setConcentrationUnit}
                />
                <div className="flex-1 p-4 lg:p-6 overflow-auto">
                    {showTable ? (
                        <DataTable 
                            plateData={plateData} 
                            updateWell={updateWell}
                            concentrationUnit={concentrationUnit}
                        />
                    ) : (
                        <PlateGrid
                            plateFormat={PLATE_96_WELL}
                            plateData={plateData}
                            selectedWells={selectedWells}
                            handleSelectWell={handleSelectWell}
                            view={view}
                            theme={theme}
                            concentrationUnit={concentrationUnit}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
