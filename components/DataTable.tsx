"use client";

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';

registerAllModules();

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
  const normalized = data.map((r) => ({
    col1: "", // DIA/COL (empty as requested)
    col2: "", // SETTING TYP. (empty as requested)
    shape: r.shape,
    size: r.shape === 'Round' ? `${r.size}` : (r.sizeY ? `${r.size}x${r.sizeY}` : `${r.size}`),
    sieveSize: r.sieveSize,
    avgWeight: r.avgWeight, // keep '-' when not present
    quantity: r.quantity,
    totalWeight: r.totalWeight,
  }));

  return (
    <div className="w-full overflow-x-auto overflow-hidden">
      <HotTable
        data={normalized}
        rowHeaders={true}
        colHeaders={[
          'DIA/COL',
          'SETTING TYP.',
          'ST. Shape',
          'MM SIZE',
          'SIEVE SIZE',
          'AVRG WT',
          'PCS',
          'CT WT',
        ]}
        columns={[
          { data: 'col1' },
          { data: 'col2' },
          { data: 'shape' },
          { data: 'size' },
          { data: 'sieveSize' },
          // Custom renderer to show number in 0.000 or '-' when string
          { 
            data: 'avgWeight',
            renderer: (instance, td, row, col, prop, value) => {
              const display = typeof value === 'number' ? (value as number).toFixed(3) : value ?? '-';
              td.textContent = String(display);
            }
          },
          { data: 'quantity', type: 'numeric' },
          { data: 'totalWeight', type: 'numeric', numericFormat: { pattern: '0,0.000' } },
        ]}
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
      />
    </div>
  );
};
