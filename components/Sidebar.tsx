
import React, { useState, useEffect } from 'react';
import { Well, ControlType, ConcentrationUnit } from '../types';
import GeminiLayoutGenerator from './GeminiLayoutGenerator';
import CheckerboardGenerator from './CheckerboardGenerator';
import { convertMassToMolar, convertMolarToMass, getWellRange } from '../utils.js';
import { ArrowsUpDownIcon, PencilSquareIcon, SparklesIcon, ClipboardDocumentListIcon } from './icons/Icons';

interface SidebarProps {
    selectedWells: Well[];
    updateMultipleWells: (ids: string[], data: Partial<Well>) => void;
    batchUpdateWells: (updates: {id: string, data: Partial<Well>}[]) => void;
    setPlateData: (data: Well[]) => void;
    clearSelection: () => void;
    concentrationUnit: ConcentrationUnit;
    setConcentrationUnit: (unit: ConcentrationUnit) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedWells, updateMultipleWells, batchUpdateWells, setPlateData, clearSelection, concentrationUnit, setConcentrationUnit }) => {
    const [activeTab, setActiveTab] = useState('edit');
    const [formState, setFormState] = useState<{ compound: string; concentrationStr: string; mwStr: string; strain: string; controlType: ControlType; replicateGroupStr: string }>({
        compound: '',
        concentrationStr: '',
        mwStr: '',
        strain: '',
        controlType: ControlType.NONE,
        replicateGroupStr: '',
    });

    const [dilutionState, setDilutionState] = useState({
        compound: '',
        mwStr: '',
        startConcStr: '100',
        endConcStr: '1',
        factorStr: '2',
        scale: 'log' as 'log' | 'linear',
    });
    const [dilutionDirection, setDilutionDirection] = useState<[Well, Well] | null>(null);

    // Effect for the main edit form
    useEffect(() => {
        if (selectedWells.length === 1) {
            const well = selectedWells[0];
            let displayConcentration;
            if (concentrationUnit === 'mass') {
                displayConcentration = well.mw > 0 ? convertMolarToMass(well.concentration, well.mw) : 0;
            } else {
                displayConcentration = well.concentration;
            }
            
            setFormState({
                compound: well.compound,
                concentrationStr: displayConcentration > 0 ? String(displayConcentration) : '',
                mwStr: well.mw > 0 ? String(well.mw) : '',
                strain: well.strain,
                controlType: well.controlType,
                replicateGroupStr: well.replicateGroup > 0 ? String(well.replicateGroup) : '',
            });
        } else {
            setFormState({ compound: '', concentrationStr: '', mwStr: '', strain: '', controlType: ControlType.NONE, replicateGroupStr: '' });
        }
    }, [selectedWells, concentrationUnit]);

    // Effects for the serial dilution tool
    useEffect(() => {
        if (selectedWells.length === 2) {
             if (!dilutionDirection || !selectedWells.find(w => w.id === dilutionDirection[0].id) || !selectedWells.find(w => w.id === dilutionDirection[1].id)) {
                const sorted = [...selectedWells].sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true}));
                setDilutionDirection(sorted as [Well, Well]);
            }
        } else {
            setDilutionDirection(null);
        }
    }, [selectedWells]);
    
    useEffect(() => {
        if (dilutionDirection) {
            const startWell = dilutionDirection[0];
            setDilutionState(prev => ({
                ...prev,
                compound: startWell.compound || '',
                mwStr: startWell.mw > 0 ? String(startWell.mw) : '',
            }));
        }
    }, [dilutionDirection]);
    
    const handleBatchUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedWells.length > 0) {
            const updatePayload: Partial<Well> = {};
            const concentrationValue = parseFloat(formState.concentrationStr) || 0;
            const mwValue = parseFloat(formState.mwStr) || 0;

            if (formState.compound.trim()) updatePayload.compound = formState.compound;
            if (formState.strain.trim()) updatePayload.strain = formState.strain;
            updatePayload.controlType = formState.controlType;
            if (mwValue > 0) updatePayload.mw = mwValue;
            if (formState.replicateGroupStr) updatePayload.replicateGroup = parseInt(formState.replicateGroupStr, 10) || 0;

            if (concentrationValue > 0) {
                if (concentrationUnit === 'mass') {
                    const finalMw = mwValue || (selectedWells.length === 1 ? selectedWells[0].mw : 0);
                    if (finalMw > 0) {
                         updatePayload.concentration = convertMassToMolar(concentrationValue, finalMw);
                    } else {
                        alert("Please provide a Molecular Weight to save concentration in mass units.");
                        return;
                    }
                } else {
                    updatePayload.concentration = concentrationValue;
                }
            } else {
                 updatePayload.concentration = 0;
            }
            
            updateMultipleWells(selectedWells.map(w => w.id), updatePayload);
        }
    };

    const handleGenerateDilution = () => {
        if (!dilutionDirection) return;

        const [startWell, endWell] = dilutionDirection;
        const wellsToFill = getWellRange(startWell.id, endWell.id);

        if (!wellsToFill) {
            alert("Serial dilution only works on wells in a single row or column.");
            return;
        }

        const mw = parseFloat(dilutionState.mwStr) || 0;
        let startConcInUM = parseFloat(dilutionState.startConcStr) || 0;
        let endConcInUM = parseFloat(dilutionState.endConcStr) || 0;
        
        if (concentrationUnit === 'mass') {
            if (mw <= 0) {
                alert("Please provide a Molecular Weight to perform dilution in mass units.");
                return;
            }
            startConcInUM = convertMassToMolar(startConcInUM, mw);
            endConcInUM = convertMassToMolar(endConcInUM, mw);
        }

        const factor = parseFloat(dilutionState.factorStr) || 1;
        const numSteps = wellsToFill.length;

        const updates = wellsToFill.map((wellId, i) => {
            let concentration = 0;
            if (dilutionState.scale === 'log') {
                if (factor > 0) {
                   concentration = startConcInUM / Math.pow(factor, i);
                }
            } else { // linear
                if (numSteps > 1) {
                    concentration = startConcInUM + (endConcInUM - startConcInUM) * (i / (numSteps - 1));
                } else {
                    concentration = startConcInUM;
                }
            }

            const data: Partial<Well> = {
                concentration,
                compound: dilutionState.compound,
                mw,
            };
            return { id: wellId, data };
        });
        
        batchUpdateWells(updates);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleDilutionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDilutionState(prev => ({ ...prev, [name]: value }));
    };

    const renderDilutionTool = () => {
        if (!dilutionDirection) return null;

        const [startWell, endWell] = dilutionDirection;
        const wellsToFill = getWellRange(startWell.id, endWell.id);

        return (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Serial Dilution Tool</h4>
                {!wellsToFill && <p className="text-xs text-yellow-500 mt-1">Select wells in a single row or column to use this tool.</p>}
                
                <div className="space-y-3 mt-3">
                     {/* Direction */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Direction</span>
                        <div className="flex items-center gap-2">
                           <span className="font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs">{startWell.id}</span>
                           <span>→</span>
                           <span className="font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs">{endWell.id}</span>
                            <button onClick={() => setDilutionDirection([endWell, startWell])} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Swap direction">
                               <ArrowsUpDownIcon />
                            </button>
                        </div>
                    </div>
                    {/* Compound and MW */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compound</label>
                        <input type="text" name="compound" value={dilutionState.compound} onChange={handleDilutionInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder="e.g., Aspirin" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Molecular Weight (g/mol)</label>
                        <input type="number" step="any" name="mwStr" value={dilutionState.mwStr} onChange={handleDilutionInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder="e.g., 180.157" />
                    </div>
                    {/* Scale */}
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scale</label>
                         <div className="flex rounded-md shadow-sm mt-1">
                            <button type="button" onClick={() => setDilutionState(p => ({...p, scale: 'log'}))} className={`px-3 py-2 text-sm font-medium rounded-l-md w-1/2 ${dilutionState.scale === 'log' ? 'bg-sciblue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Log</button>
                            <button type="button" onClick={() => setDilutionState(p => ({...p, scale: 'linear'}))} className={`px-3 py-2 text-sm font-medium rounded-r-md w-1/2 ${dilutionState.scale === 'linear' ? 'bg-sciblue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Linear</button>
                        </div>
                    </div>
                    {/* Concentration Inputs */}
                    <div className="flex items-end space-x-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Conc.</label>
                            <input type="number" step="any" name="startConcStr" value={dilutionState.startConcStr} onChange={handleDilutionInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" />
                        </div>
                        {dilutionState.scale === 'log' ? (
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Factor</label>
                                <input type="number" step="any" name="factorStr" value={dilutionState.factorStr} onChange={handleDilutionInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder="e.g., 2 for 1:2" />
                            </div>
                        ) : (
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Conc.</label>
                                <input type="number" step="any" name="endConcStr" value={dilutionState.endConcStr} onChange={handleDilutionInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" />
                            </div>
                        )}
                    </div>
                    <button onClick={handleGenerateDilution} disabled={!wellsToFill} className="w-full bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Generate Dilution
                    </button>
                </div>
            </div>
        );
    }

    const renderEditForm = () => {
        if (selectedWells.length === 0) {
            return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Select one or more wells to edit. Use Shift or Ctrl/Cmd to select multiple wells.</div>;
        }

        const concentrationLabel = concentrationUnit === 'molar' ? 'Concentration (µM)' : 'Concentration (µg/mL)';

        return (
            <form onSubmit={handleBatchUpdate} className="p-4 space-y-4">
                <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold">{selectedWells.length} well(s) selected</h3>
                    <p className="text-xs text-gray-500 truncate">{selectedWells.map(w => w.id).join(', ')}</p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Compound</label>
                    <input type="text" name="compound" value={formState.compound} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder={selectedWells.length > 1 ? "Batch Edit" : "e.g., Aspirin"} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Molecular Weight (g/mol)</label>
                    <input type="number" step="any" name="mwStr" value={formState.mwStr} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder={selectedWells.length > 1 ? "Batch Edit" : "e.g., 180.157"} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{concentrationLabel}</label>
                     <div className="flex items-center space-x-2 mt-1">
                        <input type="number" step="any" name="concentrationStr" value={formState.concentrationStr} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder={selectedWells.length > 1 ? "Batch Edit" : "e.g., 10"} />
                        <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setConcentrationUnit('molar')} className={`px-3 py-2 text-sm font-medium rounded-l-md ${concentrationUnit === 'molar' ? 'bg-sciblue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Molar</button>
                            <button type="button" onClick={() => setConcentrationUnit('mass')} className={`px-3 py-2 text-sm font-medium rounded-r-md ${concentrationUnit === 'mass' ? 'bg-sciblue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Mass</button>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Strain</label>
                    <input type="text" name="strain" value={formState.strain} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder={selectedWells.length > 1 ? "Batch Edit" : "e.g., E. coli DH5a"} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Control Type</label>
                    <select name="controlType" value={formState.controlType} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm">
                        {Object.values(ControlType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Replicate Group</label>
                    <input type="number" name="replicateGroupStr" value={formState.replicateGroupStr} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" placeholder="e.g., 1, 2..." />
                </div>
                <button type="submit" className="w-full bg-sciblue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sciblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sciblue-500">
                    Apply Changes
                </button>

                {selectedWells.length === 2 && renderDilutionTool()}
            </form>
        );
    };

    const TabButton = ({ isActive, onClick, children, label }: {isActive: boolean, onClick: () => void, children: React.ReactNode, label: string}) => (
        <button 
            onClick={onClick} 
            className={`flex flex-col items-center justify-center text-center px-3 py-2 text-xs font-medium w-full ${isActive ? 'text-sciblue-600 dark:text-sciblue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
            {children}
            <span className={`mt-1 transition-colors ${isActive ? 'text-sciblue-600 dark:text-sciblue-400' : ''}`}>{label}</span>
        </button>
    );

    return (
        <aside className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-1" aria-label="Tabs">
                    <TabButton isActive={activeTab === 'edit'} onClick={() => setActiveTab('edit')} label="Edit">
                        <PencilSquareIcon />
                    </TabButton>
                    <TabButton isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} label="AI Assistant">
                        <SparklesIcon />
                    </TabButton>
                    <TabButton isActive={activeTab === 'templates'} onClick={() => setActiveTab('templates')} label="Templates">
                        <ClipboardDocumentListIcon />
                    </TabButton>
                </nav>
            </div>
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'edit' && renderEditForm()}
                {activeTab === 'ai' && <GeminiLayoutGenerator setPlateData={setPlateData} clearSelection={clearSelection} />}
                {activeTab === 'templates' && <CheckerboardGenerator setPlateData={setPlateData} clearSelection={clearSelection}/>}
            </div>
        </aside>
    );
};

export default Sidebar;
