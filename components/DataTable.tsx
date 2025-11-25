"use client";

import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import HyperFormula from "hyperformula";
import { useRef, forwardRef, useImperativeHandle } from "react";
import html2canvas from "html2canvas";

import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import "./handsontable-overrides.css";

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

export interface DataTableRef {
  captureSnapshot: () => Promise<void>;
}

export const DataTable = forwardRef<DataTableRef, DataTableProps>(({ data }, ref) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotTableRef = useRef<any>(null);

  // Function to capture the full table
  const captureTableSnapshot = async () => {
    if (!hotTableRef.current) return;

    const hotInstance = hotTableRef.current.hotInstance;
    if (!hotInstance) return;

    // Create a temporary container for rendering the full table
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.style.padding = "20px";
    document.body.appendChild(tempContainer);

    try {
      // Get all data from Handsontable
      const rowCount = hotInstance.countRows();
      const colCount = hotInstance.countCols();
      const colHeaders = hotInstance.getSettings().colHeaders as string[];

      // Create a static HTML table
      const table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.fontFamily = "Arial, Helvetica, sans-serif";
      table.style.fontSize = "20px";
      table.style.backgroundColor = "#ffffff";
      table.style.color = "#000000";
      table.style.border = "2px solid #333";

      // Create header row
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      
      // Add row number header
      const rowNumHeader = document.createElement("th");
      rowNumHeader.textContent = "";
      rowNumHeader.style.border = "1px solid #666";
      rowNumHeader.style.padding = "4px 10px";
      rowNumHeader.style.verticalAlign = "middle";
      rowNumHeader.style.backgroundColor = "#1f636e";
      rowNumHeader.style.fontWeight = "bold";
      rowNumHeader.style.minWidth = "50px";
      rowNumHeader.style.color = "#ffffff";
      rowNumHeader.style.textAlign = "center";
      headerRow.appendChild(rowNumHeader);

      // Add column headers
      colHeaders.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.border = "1px solid #666";
        th.style.padding = "4px 10px";
        th.style.verticalAlign = "middle";
        th.style.backgroundColor = "#1f636e";
        th.style.fontWeight = "bold";
        th.style.whiteSpace = "nowrap";
        th.style.color = "#ffffff";
        th.style.minWidth = "80px";
        th.style.textAlign = "center";
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create body rows
      const tbody = document.createElement("tbody");
      for (let row = 0; row < rowCount; row++) {
        const tr = document.createElement("tr");
        const isLastRow = row === rowCount - 1; // Total row
        
        // Add row number
        const rowNumCell = document.createElement("td");
        rowNumCell.textContent = isLastRow ? "" : String(row + 1);
        rowNumCell.style.border = "1px solid #999";
        rowNumCell.style.padding = "6px 12px";
        rowNumCell.style.lineHeight = "0.75"
        rowNumCell.style.verticalAlign = "middle";
        rowNumCell.style.backgroundColor = isLastRow ? "#d4d4d4" : "#f5f5f5";
        rowNumCell.style.fontWeight = "bold";
        rowNumCell.style.color = "#000000";
        rowNumCell.style.textAlign = "center";
        tr.appendChild(rowNumCell);

        // Add data cells
        for (let col = 0; col < colCount; col++) {
          const td = document.createElement("td");
          const cellData = hotInstance.getDataAtCell(row, col);
          
          if (cellData === null || cellData === undefined || cellData === "") {
            td.textContent = "-";
          } else if (typeof cellData === "number") {
            // Format numbers with appropriate decimals
            if (col === 5) { // AVRG WT column - 3 decimals
              td.textContent = cellData.toFixed(3);
            } else {
              td.textContent = String(cellData);
            }
          } else {
            td.textContent = String(cellData);
          }

          td.style.border = "1px solid #999";
          td.style.padding = "6px 12px";
          td.style.verticalAlign = "middle";
          td.style.textAlign = col < 3 ? "left" : "center";
          td.style.color = "#000000";
          td.style.backgroundColor = "#ffffff";
          td.style.fontWeight = "bold";
          
          if (isLastRow) {
            td.style.fontWeight = "bold";
            td.style.backgroundColor = "#e8e8e8";
            // Handle merged cells for TOTAL row
            if (col === 0 && cellData === "TOTAL") {
              td.colSpan = 6;
              td.style.textAlign = "center";
            }
          }

          tr.appendChild(td);
          
          // Skip the next 5 cells if we just created a merged TOTAL cell
          if (isLastRow && col === 0 && cellData === "TOTAL") {
            col = 5;
          }
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      tempContainer.appendChild(table);

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture the temporary table
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `diamond-metrics-table-${new Date().toISOString().slice(0, 10)}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } finally {
      // Remove the temporary container
      document.body.removeChild(tempContainer);
    }
  };

  // Expose capture function to parent via ref
  useImperativeHandle(ref, () => ({
    captureSnapshot: captureTableSnapshot,
  }));

  const buildCtwtFormula = (rowNumber: number) =>
    `=IF(AND(ISNUMBER(F${rowNumber}), ISNUMBER(G${rowNumber})), F${rowNumber}*G${rowNumber}, "")`;

  // Normalize data and create computed columns
  const normalized = data.map((r, idx) => ({
    col1: "",
    col2: "",
    shape: r.shape,
    size:
      r.shape === "Round"
        ? r.size.toFixed(2)
        : r.sizeY
        ? `${r.sizeY.toFixed(2)}x${r.size.toFixed(2)}`
        : `${r.size.toFixed(2)}`,
    sieveSize: r.sieveSize,
    avgWeight: r.avgWeight,
    quantity: r.quantity,
    // Handsontable columns: F = avgWeight (6th), G = quantity (7th), H = ctwt (8th)
    // Use formulas that auto update
    ctwt: buildCtwtFormula(idx + 1),
  }));

  const totalsRow = {
    col1: "TOTAL",
    col2: "",
    shape: "",
    size: "",
    sieveSize: "",
    avgWeight: "",
    // Sum of PCS (G column)
    quantity: `=SUM(G1:G${normalized.length})`,
    // Sum only numeric CT WT values
    ctwt: `=SUM(H1:H${normalized.length})`,
    _isTotal: true,
  };

  const normalizedWithTotal = [...normalized, totalsRow];

  const applyCtwtFormulaForRange = (startRow: number, amount: number) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    const lastDataRowIndex = hotInstance.countRows() - 2; // skip TOTAL row

    for (let row = startRow; row < startRow + amount; row++) {
      if (row > lastDataRowIndex) break;
      const rowNumber = row + 1;
      hotInstance.setDataAtCell(row, 7, buildCtwtFormula(rowNumber), "loadData");
    }
  };

  const updateTotalRowFormulas = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;

    const totalRowIndex = hotInstance.countRows() - 1;
    if (totalRowIndex < 0) return;

    const lastDataRowNumber = totalRowIndex; // convert index to 1-based row number
    if (lastDataRowNumber === 0) {
      hotInstance.setDataAtCell(totalRowIndex, 6, 0, "loadData");
      hotInstance.setDataAtCell(totalRowIndex, 7, 0, "loadData");
      return;
    }

    hotInstance.setDataAtCell(
      totalRowIndex,
      6,
      `=SUM(G1:G${lastDataRowNumber})`,
      "loadData"
    );
    hotInstance.setDataAtCell(
      totalRowIndex,
      7,
      `=SUM(H1:H${lastDataRowNumber})`,
      "loadData"
    );
  };

  return (
    <div className="w-full">
      <div ref={tableContainerRef} className="w-full overflow-x-auto overflow-hidden">
        <HotTable
          ref={hotTableRef}
          data={normalizedWithTotal}
          rowHeaders={true}
          colHeaders={[
            "DIA/COL",
            "SETTING TYP.",
            "ST. Shape",
            "MM SIZE",
            "SIEVE SIZE",
            "AVRG WT",
            "PCS",
            "CT WT",
          ]}
          columns={[
            { data: "col1" },
            { data: "col2" },
            { data: "shape" },
            { data: "size" },
            { data: "sieveSize" },
            {
              data: "avgWeight",
              type: "numeric",
              renderer: (instance, td, row, _col, prop, value) => {
                const display =
                  typeof value === "number"
                    ? (value as number).toFixed(3)
                    : value ?? "-";
                td.textContent = String(display);
              },
            },
            { data: "quantity", type: "numeric" },
            {
              data: "ctwt",
              type: "numeric",
              renderer: (instance, td, row, _col, prop, value) => {
                if (row === normalizedWithTotal.length - 1) {
                  // total row
                  td.textContent =
                    typeof value === "number" && !isNaN(value)
                      ? String(value)
                      : "0";
                  td.classList.add("font-semibold");
                  return;
                }
                td.textContent =
                  typeof value === "number" && !isNaN(value) && value !== 0
                    ? String(value)
                    : "-";
              },
              readOnly: true,
            },
          ]}
          formulas={{
            engine: HyperFormula.buildEmpty({
              licenseKey: "gpl-v3", // required to enable HyperFormula fully
            }),
          }}
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
            {
              row: normalizedWithTotal.length - 1,
              col: 0,
              rowspan: 1,
              colspan: 6,
            },
          ]}
          cells={(row) => {
            if (row === normalizedWithTotal.length - 1) {
              return { className: "ht-total-row", readOnly: true };
            }
            return {};
          }}
          afterInit={() => {
            updateTotalRowFormulas();
          }}
          afterLoadData={() => {
            updateTotalRowFormulas();
          }}
          afterCreateRow={(index, amount) => {
            applyCtwtFormulaForRange(index, amount);
            updateTotalRowFormulas();
          }}
          afterRemoveRow={() => {
            updateTotalRowFormulas();
          }}
        />
      </div>
    </div>
  );
});

DataTable.displayName = "DataTable";
