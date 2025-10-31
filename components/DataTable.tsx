"use client";

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
// REMOVED: import { Formulas } from '@handsontable/formulas';
import HyperFormula from 'hyperformula';

import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import './handsontable-overrides.css';

registerAllModules();
// REMOVED: HotTable.registerPlugin(Formulas);

interface EnrichedDiamondRow {
  quantity: number;
  shape: string;
  size: number;
  sizeY?: number;
  sieveSize: string;
  avgWeight: number | string;
  totalWeight: number;
}

interface DataTableProps {
  data: EnrichedDiamondRow[]; 
}

export const DataTable = ({ data }: DataTableProps) => {
  // Build normalized rows and use formulas for computed fields
  const normalized = data.map((r, idx) => ({
    col1: "",
    col2: "",
    shape: r.shape,
    size: r.shape === 'Round'
      ? r.size.toFixed(2)
      : (r.sizeY ? `${r.size.toFixed(2)}x${r.sizeY.toFixed(2)}` : `${r.size.toFixed(2)}`),
    sieveSize: r.sieveSize,
    avgWeight: r.avgWeight,
    quantity: r.quantity,
    // Handsontable columns: F = avgWeight (6th), G = quantity (7th), H = ctwt (8th)
    // Rows in formulas are 1-based; add 1 for header row offset
    ctwt: `=F${idx + 1}*G${idx + 1}`,
  }));

  const totalsRow = {
    col1: 'TOTAL',
    col2: '',
    shape: '',
    size: '',
    sieveSize: '',
    avgWeight: '',
    // Sum of PCS (G column) for all data rows
    quantity: `=SUM(G1:G${normalized.length})`,
    // Sum of CT WT (H column) for all data rows
    ctwt: `=SUM(H1:H${normalized.length})`,
    _isTotal: true,
  };
  const normalizedWithTotal = [...normalized, totalsRow];

  return (
    <div className="w-full overflow-x-auto overflow-hidden">
      <HotTable
        data={normalizedWithTotal}
        rowHeaders={true}
        colHeaders={[
          'DIA/COL', 'SETTING TYP.', 'ST. Shape', 'MM SIZE', 'SIEVE SIZE', 'AVRG WT', 'PCS', 'CT WT',
        ]}
        columns={[
          { data: 'col1' },
          { data: 'col2' },
          { data: 'shape' },
          { data: 'size' },
          { data: 'sieveSize' },
          {
            data: 'avgWeight',
            renderer: (instance, td, row, _col, prop, value) => {
              const display = typeof value === 'number' ? (value as number).toFixed(3) : value ?? '-';
              td.textContent = String(display);
            }
          },
          { data: 'quantity', type: 'numeric' },
          // CT WT: formula-driven
          {
            data: 'ctwt',
            type: 'numeric',
            renderer: (instance, td, row, _col, prop, value) => {
              // If total row, always show total. Otherwise, show '-' for empty/invalid
              if (row === normalizedWithTotal.length - 1) {
                td.textContent = value ? value : '0.00';
                return;
              }
              td.textContent = typeof value === 'number' && !isNaN(value) && value !== 0
                ? value.toFixed(2)
                : '-';
            },
            readOnly: true
          }
        ]}
        formulas={{ engine: HyperFormula.buildEmpty() }}
        stretchH="all"
        height={520}
        width="100%"
        colWidths={[100, 120, 110, 120, 130, 110, 100, 110]}
        autoWrapRow={false}
        autoWrapCol={false}
        autoColumnSize={false}
        manualColumnResize={true}
        manualRowResize={true}
        contextMenu={true}
        dropdownMenu={true}
        filters={true}
        preventOverflow="horizontal"
        licenseKey="non-commercial-and-evaluation"
        themeName="ht-theme-main"
        mergeCells={[
          { row: normalizedWithTotal.length - 1, col: 0, rowspan: 1, colspan: 6 }
        ]}
        cells={(row) => {
          if (row === normalizedWithTotal.length - 1) {
            return { className: 'ht-total-row', readOnly: true };
          }
          return {};
        }}
      />
    </div>
  );
};
