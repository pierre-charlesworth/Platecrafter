
import { useState, useCallback } from 'react';
import { Well, ControlType, PlateFormat } from '../types';

const createInitialPlateData = (format: PlateFormat): Well[] => {
    return format.rowLabels.flatMap(row =>
        format.colLabels.map(col => ({
            id: `${row}${col}`,
            compound: '',
            concentration: 0,
            mw: 0,
            strain: '',
            controlType: ControlType.NONE,
            replicateGroup: 0,
        }))
    );
};

export const usePlateState = (plateFormat: PlateFormat) => {
    const [history, setHistory] = useState<Well[][]>([createInitialPlateData(plateFormat)]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [selectedWells, setSelectedWells] = useState<string[]>([]);
    
    const plateData = history[historyIndex];
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const updateState = useCallback((newData: Well[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);
    
    const setPlateData = useCallback((newData: Well[]) => {
        updateState(newData);
    }, [updateState]);


    const undo = useCallback(() => {
        if (canUndo) {
            setHistoryIndex(historyIndex - 1);
        }
    }, [canUndo, historyIndex]);

    const redo = useCallback(() => {
        if (canRedo) {
            setHistoryIndex(historyIndex + 1);
        }
    }, [canRedo, historyIndex]);

    const updateWell = useCallback((id: string, newWellData: Partial<Well>) => {
        const newData = plateData.map(well =>
            well.id === id ? { ...well, ...newWellData } : well
        );
        updateState(newData);
    }, [plateData, updateState]);
    
    const updateMultipleWells = useCallback((ids: string[], newWellData: Partial<Well>) => {
        const newData = plateData.map(well => 
            ids.includes(well.id) ? { ...well, ...newWellData } : well
        );
        updateState(newData);
    }, [plateData, updateState]);

    const batchUpdateWells = useCallback((updates: { id: string; data: Partial<Well> }[]) => {
        const updatesMap = new Map(updates.map(u => [u.id, u.data]));
        const newData = plateData.map(well => {
            if (updatesMap.has(well.id)) {
                const update = updatesMap.get(well.id)!;
                return { ...well, ...update };
            }
            return well;
        });
        updateState(newData);
    }, [plateData, updateState]);

    const handleSelectWell = useCallback((wellId: string, event: React.MouseEvent) => {
        event.preventDefault();
        if (event.shiftKey) {
            setSelectedWells(prev => {
                if(prev.includes(wellId)) {
                    return prev.filter(id => id !== wellId);
                }
                return [...prev, wellId];
            });
        } else if (event.ctrlKey || event.metaKey) {
             setSelectedWells(prev => prev.includes(wellId) ? prev.filter(id => id !== wellId) : [...prev, wellId]);
        }
        else {
            setSelectedWells([wellId]);
        }
    }, []);
    
    const clearSelection = useCallback(() => {
        setSelectedWells([]);
    }, []);

    return {
        plateData,
        selectedWells,
        updateWell,
        updateMultipleWells,
        batchUpdateWells,
        handleSelectWell,
        clearSelection,
        setPlateData,
        undo,
        redo,
        canUndo,
        canRedo,
    };
};
