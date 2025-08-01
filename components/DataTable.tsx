import React from 'react';
import { Well, ControlType, ConcentrationUnit } from '../types';
import { formatConcentration, convertMassToMolar } from '../utils.js';

interface DataTableProps {
    plateData: Well[];
    updateWell: (id: string, newWellData: Partial<Well>) => void;
    concentrationUnit: ConcentrationUnit;
}

const DataTable: React.FC<DataTableProps> = ({ plateData, updateWell, concentrationUnit }) => {
    
    const handleCellChange = (well: Well, field: keyof Well, value: string) => {
        const updateData: Partial<Well> = {};

        switch (field) {
            case 'concentration': {
                const numericValue = value === '' ? 0 : Number(value);
                const finalConcentration = concentrationUnit === 'mass'
                    ? convertMassToMolar(numericValue, well.mw)
                    : numericValue;
                updateData.concentration = isNaN(finalConcentration) ? well.concentration : finalConcentration;
                break;
            }
            case 'mw':
            case 'replicateGroup': {
                const numericValue = value === '' ? 0 : Number(value);
                updateData[field] = isNaN(numericValue) ? 0 : numericValue;
                break;
            }
            case 'controlType':
                updateData[field] = value as ControlType;
                break;
            case 'compound':
            case 'strain':
                updateData[field] = value;
                break;
            case 'id':
                // ID is not editable from the table view.
                return;
        }
        
        updateWell(well.id, updateData);
    };

    const concentrationHeader = concentrationUnit === 'molar' ? 'Concentration (auto-scaled)' : 'Concentration (auto-scaled mass)';

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Data Table</h2>
            <div className="flex-1 overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                            <th className="sticky top-0 left-0 z-20 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">Well ID</th>
                            <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">Compound</th>
                            <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">MW (g/mol)</th>
                            <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">{concentrationHeader}</th>
                            <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">Strain</th>
                            <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600">Control Type</th>
                            <th className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-600">Replicate Group</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900">
                        {plateData.map((well) => (
                            <tr key={well.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-3 py-2 whitespace-nowrap text-sm font-medium border-b border-r border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                                    {well.id}
                                </td>
                                
                                <td className="p-0 border-b border-r border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sciblue-500 focus-within:z-10 relative">
                                    <input type="text" value={well.compound} onChange={(e) => handleCellChange(well, 'compound', e.target.value)} className="w-full h-full bg-transparent focus:outline-none px-3 py-2 text-sm text-gray-900 dark:text-gray-100"/>
                                </td>
                                 <td className="p-0 border-b border-r border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sciblue-500 focus-within:z-10 relative">
                                    <input type="number" value={well.mw || ''} onChange={(e) => handleCellChange(well, 'mw', e.target.value)} className="w-full h-full bg-transparent focus:outline-none px-3 py-2 text-sm text-gray-900 dark:text-gray-100"/>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-b border-r border-gray-300 dark:border-gray-600">
                                    {formatConcentration(well.concentration, well.mw, concentrationUnit)}
                                </td>
                                <td className="p-0 border-b border-r border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sciblue-500 focus-within:z-10 relative">
                                    <input type="text" value={well.strain} onChange={(e) => handleCellChange(well, 'strain', e.target.value)} className="w-full h-full bg-transparent focus:outline-none px-3 py-2 text-sm text-gray-900 dark:text-gray-100"/>
                                </td>
                                <td className="p-0 border-b border-r border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sciblue-500 focus-within:z-10 relative">
                                    <select value={well.controlType} onChange={(e) => handleCellChange(well, 'controlType', e.target.value)} className="w-full h-full bg-transparent focus:outline-none px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-none rounded-none">
                                        {Object.values(ControlType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                                    </select>
                                </td>
                                <td className="p-0 border-b border-r border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-sciblue-500 focus-within:z-10 relative">
                                    <input type="number" value={well.replicateGroup || ''} onChange={(e) => handleCellChange(well, 'replicateGroup', e.target.value)} className="w-full h-full bg-transparent focus:outline-none px-3 py-2 text-sm text-gray-900 dark:text-gray-100"/>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;