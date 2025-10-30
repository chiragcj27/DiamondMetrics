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
  // Remove totalWeight from normalized and use formula property
  const normalized = data.map((r) => ({
    col1: "",
    col2: "",
    shape: r.shape,
    size: r.shape === 'Round'
      ? r.size.toFixed(2)
      : (r.sizeY ? `${r.size.toFixed(2)}x${r.sizeY.toFixed(2)}` : `${r.size.toFixed(2)}`),
    sieveSize: r.sieveSize,
    avgWeight: r.avgWeight,
    quantity: r.quantity,
    ctwt:
      typeof r.avgWeight === 'number' && !isNaN(r.avgWeight) && typeof r.quantity === 'number' && !isNaN(r.quantity)
        ? r.avgWeight * r.quantity
        : '',
  }));

  // Compute totals
  const totalQuantity = data.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const totalCtwt = normalized.reduce(
    (acc, row) => {
      const val = typeof row.ctwt === 'number' && !isNaN(row.ctwt) ? row.ctwt : 0;
      return acc + val;
    },
    0
  );
  const totalsRow = {
    col1: 'TOTAL',
    col2: '',
    shape: '',
    size: '',
    sieveSize: '',
    avgWeight: '',
    quantity: totalQuantity,
    ctwt: totalCtwt.toFixed(2),
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
