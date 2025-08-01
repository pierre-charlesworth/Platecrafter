
import React, { useState } from 'react';
import { Well, ControlType, ConcentrationUnit } from '../types';
import { PLATE_96_WELL } from '../constants';
import { ClipboardDocumentListIcon, DocumentDuplicateIcon } from './icons/Icons';
import { convertMassToMolar } from '../utils.js';

interface CheckerboardGeneratorProps {
  setPlateData: (data: Well[]) => void;
  clearSelection: () => void;
}

const createInitialPlateData = (): Well[] => {
    return PLATE_96_WELL.rowLabels.flatMap(row =>
        PLATE_96_WELL.colLabels.map(col => ({
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

interface FormState {
    drugA: string;
    concA: string;
    mwA: string;
    unitA: ConcentrationUnit;
    drugB: string;
    concB: string;
    mwB: string;
    unitB: ConcentrationUnit;
    factor: string;
}

const generateProtocolText = (state: FormState): string => {
    const { drugA, concA, unitA, drugB, concB, unitB, factor } = state;
    const concA_num = parseFloat(concA) || 0;
    const concB_num = parseFloat(concB) || 0;
    const concA_unit = unitA === 'molar' ? 'µM' : 'µg/mL';
    const concB_unit = unitB === 'molar' ? 'µM' : 'µg/mL';
    const factorNum = parseFloat(factor) || 2;

    const stock_SA_conc = (concA_num * 4).toFixed(2);
    const stock_2xSA_conc = (concA_num * 8).toFixed(2);
    const stock_SB_conc = (concB_num * 4).toFixed(2);

    return `
Method Protocol: Drug Combination Study by Checkerboard Assay
Protocol adapted from: Bellio, P., Fagnani, L., Nazzicone, L., & Celenza, G. (2021). New and simplified method for drug combination studies by checkerboard assay. MethodsX, 8, 101543. https://doi.org/10.1016/j.mex.2021.101543

Required Stock Solutions:
- ${drugA} (Stock SA, 4x): Prepare a ${stock_SA_conc} ${concA_unit} solution in 2xCAMHB.
- ${drugA} (Stock 2xSA, 8x): Prepare a ${stock_2xSA_conc} ${concA_unit} solution in 2xCAMHB.
- ${drugB} (Stock SB, 4x): Prepare a ${stock_SB_conc} ${concB_unit} solution in 2xCAMHB.

Highest Final Concentrations:
- Drug A: ${concA} ${concA_unit}
- Drug B: ${concB} ${concB_unit}
- Dilution Factor: 1:${factorNum}

---

DAY 1: Preparation of Media, Stocks, and Inoculum

1. Preparation of Culture Media:
   - Prepare Mueller-Hinton Broth (MHB) and 2x concentrated Cation-adjusted Mueller-Hinton Broth (2xCAMHB) according to manufacturer instructions.
   - Sterilize by autoclaving at 121°C for 15 minutes.

2. Preparation of Microbial Inoculum:
   - Inoculate a single colony of the test microorganism into 10 mL of MHB.
   - Grow at 35±2°C in a shaker incubator (approx. 200 rpm) for 18±2 hours. This should yield a culture of ~10⁸ CFU/mL.

3. Preparation of Drug Stock Solutions:
   - Prepare the 4x and 8x stock solutions for Drug A and Drug B as specified in the "Required Stock Solutions" section above using 2xCAMHB as the diluent.
   - You will need at least 1.5 mL of Stock SA, 500 µL of Stock 2xSA, and 1.0 mL of Stock SB.

---

DAY 2: Plate Preparation and Dilutions

1. Initial Plate Setup:
   - This protocol results in a final volume of 200 µL per well.
   - All wells initially contain 50 µL of 2xCAMHB medium.
   - 50 µL of Drug A solution is added.
   - 50 µL of Drug B solution is added.
   - 50 µL of inoculum is added.

2. Preparation and Dispensing of ${drugA}:
   - Dispense 100 µL of the 4x stock (Stock SA) of ${drugA} into each well of row A, columns 1-11.
   - Dispense 100 µL of the 8x stock (Stock 2xSA) of ${drugA} into well A12.

3. First Serial Dilution (${drugA}):
   - Using a multichannel pipette set to 100 µL, perform a 1:${factorNum} serial dilution of ${drugA} by transferring from row A to row B, then B to C, and so on, down to row G.
   - Mix thoroughly by pipetting up and down in each row before transferring to the next.
   - Discard 100 µL from row G after the final mix. Row H will contain no ${drugA}.

4. Preparation and Dispensing of ${drugB}:
   - Dispense 100 µL of the 4x stock (Stock SB) of ${drugB} into each well of column 12 (rows A-H).

5. Second Serial Dilution (${drugB}):
   - Using a multichannel pipette set to 100 µL, perform a 1:${factorNum} serial dilution of ${drugB} by transferring from column 12 to column 11, then 11 to 10, and so on, across to column 2.
   - Mix thoroughly by pipetting up and down in each column before transferring to the next.
   - Discard 100 µL from column 2 after the final mix. Column 1 will contain no ${drugB}.

6. Plate Inoculation:
   - Prepare a bacterial inoculum of 10⁶ CFU/mL in 0.9% NaCl from the Day 1 culture.
   - Using a multichannel pipette, dispense 100 µL of this final inoculum into each well of the microplate.
   - The final inoculum concentration in each well will be 5 x 10⁵ CFU/mL.
   - Note: It is recommended to prepare a parallel "mirror plate" with all reagents but without bacteria to serve as a background/no-growth control.

7. Plate Incubation:
   - Cover the plate and place it in a static incubator at 35±2°C for 18±2 hours.
   - A tray with water can be added to the incubator to prevent evaporation.

---

DAY 3: Analysis

1. Optical Density Reading:
   - After incubation, mix the contents of the wells with a multichannel pipette.
   - Read the optical density (OD) of the plate at 600 nm (or a similar wavelength) using a microplate reader.

2. Data Analysis:
   - Calculate the percentage of growth for each well using the formula:
     Growth % = [(OD_combination_well - OD_background) / (OD_drug_free_well - OD_background)] x 100
   - OD_drug_free_well: Well H1 (growth control).
   - OD_background: A blank well or the corresponding well from the mirror plate.
   - The Minimal Inhibitory Concentration (MIC) can be determined as the lowest drug concentration that reduces bacterial growth by a defined threshold (e.g., >80%).
`.trim();
};

const InputField = ({ label, name, value, onChange, placeholder, type = "text", step, required }: {label: string, name: string, value: string, onChange: React.ChangeEventHandler<HTMLInputElement>, placeholder?: string, type?: string, step?: string | number, required?: boolean }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm"
            placeholder={placeholder}
            step={step}
            required={required}
        />
    </div>
);

const UnitSwitcher = ({ onUnitChange, selectedUnit }: { onUnitChange: (unit: ConcentrationUnit) => void, selectedUnit: ConcentrationUnit }) => (
     <div className="flex rounded-md shadow-sm">
        <button type="button" onClick={() => onUnitChange('molar')} className={`px-3 py-2 text-sm font-medium rounded-l-md w-1/2 ${selectedUnit === 'molar' ? 'bg-sciblue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Molar</button>
        <button type="button" onClick={() => onUnitChange('mass')} className={`px-3 py-2 text-sm font-medium rounded-r-md w-1/2 ${selectedUnit === 'mass' ? 'bg-sciblue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>Mass</button>
    </div>
);


const CheckerboardGenerator: React.FC<CheckerboardGeneratorProps> = ({ setPlateData, clearSelection }) => {
    const [formState, setFormState] = useState<FormState>({
        drugA: 'Drug A',
        concA: '100',
        mwA: '',
        unitA: 'molar',
        drugB: 'Drug B',
        concB: '50',
        mwB: '',
        unitB: 'molar',
        factor: '2',
    });
    const [protocol, setProtocol] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<string>('');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleUnitChange = (drug: 'A' | 'B', unit: ConcentrationUnit) => {
        if (drug === 'A') {
            setFormState(prev => ({ ...prev, unitA: unit }));
        } else {
            setFormState(prev => ({ ...prev, unitB: unit }));
        }
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        
        const mwA = parseFloat(formState.mwA) || 0;
        const mwB = parseFloat(formState.mwB) || 0;

        if (formState.unitA === 'mass' && mwA <= 0) {
            alert('Please provide a Molecular Weight for Drug A to use mass units.');
            return;
        }
        if (formState.unitB === 'mass' && mwB <= 0) {
            alert('Please provide a Molecular Weight for Drug B to use mass units.');
            return;
        }

        let highestConcA_uM = parseFloat(formState.concA) || 0;
        if (formState.unitA === 'mass') {
            highestConcA_uM = convertMassToMolar(highestConcA_uM, mwA);
        }

        let highestConcB_uM = parseFloat(formState.concB) || 0;
        if (formState.unitB === 'mass') {
            highestConcB_uM = convertMassToMolar(highestConcB_uM, mwB);
        }

        const factor = parseFloat(formState.factor) || 2;
        const newPlate = createInitialPlateData();
        const plateMap = new Map(newPlate.map(well => [well.id, well]));

        const { rowLabels, colLabels } = PLATE_96_WELL;

        // The layout is defined by rows A-G and columns 1-12.
        // Drug A is diluted down from row A to G.
        // Drug B is diluted across from column 12 to 2.

        for (let r_idx = 0; r_idx < 7; r_idx++) { // Rows A-G for Drug A
            const concA = highestConcA_uM / Math.pow(factor, r_idx);
            for (let c_idx = 0; c_idx < 12; c_idx++) { // All columns
                 const wellId = `${rowLabels[r_idx]}${colLabels[c_idx]}`;
                 const well = plateMap.get(wellId);
                 if(well) {
                     well.concentration = concA;
                     well.mw = mwA;
                     well.compound = formState.drugA;
                 }
            }
        }
        
        for (let c_idx = 1; c_idx < 12; c_idx++) { // Columns 2-12 for Drug B
            const exponent = (colLabels.length - 1) - c_idx; // 10 for col 2, 0 for col 12
            const concB = highestConcB_uM / Math.pow(factor, exponent);
            for (let r_idx = 0; r_idx < 8; r_idx++) { // All rows
                 const wellId = `${rowLabels[r_idx]}${colLabels[c_idx]}`;
                 const well = plateMap.get(wellId);
                 if(well) {
                    if (r_idx < 7) { // Combination wells A-G
                        well.compound = `${formState.drugA} + ${formState.drugB}`;
                        // Concentration is already set to Drug A's concentration
                    } else { // Row H, Drug B only
                        well.compound = formState.drugB;
                        well.concentration = concB;
                        well.mw = mwB;
                    }
                 }
            }
        }
        
        // Finalize control wells
        const growthControl = plateMap.get('H1');
        if (growthControl) {
            growthControl.compound = 'Growth Control';
            growthControl.controlType = ControlType.POSITIVE;
            growthControl.concentration = 0;
            growthControl.mw = 0;
        }
        
        setPlateData(Array.from(plateMap.values()));
        setProtocol(generateProtocolText(formState));
        clearSelection();
    };
    
    const handleCopyProtocol = () => {
        navigator.clipboard.writeText(protocol).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Checkerboard Assay</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate a two-drug combination layout based on the method by Bellio, et al. (2021).
            </p>
            <form onSubmit={handleGenerate} className="space-y-4">
                <div className="p-3 border rounded-md border-gray-200 dark:border-gray-700 space-y-3">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Drug A (Diluted Vertically)</h4>
                    <InputField label="Name" name="drugA" value={formState.drugA} onChange={handleInputChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Highest Final Concentration ({formState.unitA === 'molar' ? 'µM' : 'µg/mL'})</label>
                         <div className="flex items-center space-x-2 mt-1">
                            <input type="number" name="concA" value={formState.concA} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" step="any" required/>
                             <UnitSwitcher onUnitChange={(unit) => handleUnitChange('A', unit)} selectedUnit={formState.unitA}/>
                        </div>
                    </div>
                    <InputField label="MW (g/mol)" name="mwA" value={formState.mwA} onChange={handleInputChange} type="number" step="any" placeholder="Required for mass units" required={formState.unitA === 'mass'}/>
                </div>

                <div className="p-3 border rounded-md border-gray-200 dark:border-gray-700 space-y-3">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Drug B (Diluted Horizontally)</h4>
                    <InputField label="Name" name="drugB" value={formState.drugB} onChange={handleInputChange} />
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Highest Final Concentration ({formState.unitB === 'molar' ? 'µM' : 'µg/mL'})</label>
                         <div className="flex items-center space-x-2 mt-1">
                            <input type="number" name="concB" value={formState.concB} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-sciblue-500 focus:ring-sciblue-500 sm:text-sm" step="any" required/>
                            <UnitSwitcher onUnitChange={(unit) => handleUnitChange('B', unit)} selectedUnit={formState.unitB}/>
                        </div>
                    </div>
                    <InputField label="MW (g/mol)" name="mwB" value={formState.mwB} onChange={handleInputChange} type="number" step="any" placeholder="Required for mass units" required={formState.unitB === 'mass'}/>
                </div>
                 <InputField label="Serial Dilution Factor" name="factor" value={formState.factor} onChange={handleInputChange} type="number" step="any" required/>

                 <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                    <ClipboardDocumentListIcon /> <span className="ml-2">Generate Assay & Protocol</span>
                </button>
            </form>
            
            {protocol && (
                <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Generated Protocol</h4>
                        <button onClick={handleCopyProtocol} className="flex items-center text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors">
                            <DocumentDuplicateIcon />
                            <span className="ml-2">{copySuccess || 'Copy'}</span>
                        </button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 bg-transparent p-0 m-0">
                        {protocol}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default CheckerboardGenerator;
