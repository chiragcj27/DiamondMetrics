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
    shape: r.shape,
    size: r.sizeY ? `${r.size}x${r.sizeY}` : `${r.size}`,
    quantity: r.quantity,
    sieveSize: r.sieveSize,
    avgWeight: r.avgWeight === '-' ? null : (r.avgWeight as number),
    totalWeight: r.totalWeight,
  }));

  return (
    <div className="w-full overflow-x-auto overflow-hidden">
      <HotTable
        data={normalized}
        rowHeaders={true}
        colHeaders={[
          'Shape',
          'Size',
          'Quantity',
          'Sieve Size',
          'Avg Weight',
          'Total Weight',
        ]}
        columns={[
          { data: 'shape' },
          { data: 'size' },
          { data: 'quantity', type: 'numeric' },
          { data: 'sieveSize' },
          { data: 'avgWeight', type: 'numeric', numericFormat: { pattern: '0,0.000' } },
          { data: 'totalWeight', type: 'numeric', numericFormat: { pattern: '0,0.000' } },
        ]}
        stretchH="all"
        height={520}
        width="100%"
        colWidths={[110, 120, 110, 130, 130, 130]}
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
