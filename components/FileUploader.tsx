"use client";

import { useState } from "react";
import { parseDiamondFile, DiamondRow } from "./Parser";
import sievePresets from "../data/seivePresets.json";
import weightPresets from "../data/weightPresets.json";
import { DataTable } from "./DataTable";

interface EnrichedDiamondRow extends DiamondRow {
  sieveSize: string;
  avgWeight: number | string;
  totalWeight: number;
}

// Type for preset objects with string keys
type PresetObject = Record<string, string>;

export const FileUploader = () => {
  const [rows, setRows] = useState<EnrichedDiamondRow[]>([]);

  // Generate common numeric string variants so we can match presets that
  // differ in decimal formatting (e.g. "0.80" vs "0.8", "1.00" vs "1").
  const numberKeyVariants = (value: number): string[] => {
    const v2 = value.toFixed(2);             // 0.80
    const v1 = value.toFixed(1);             // 0.8
    const trimmed = String(parseFloat(v2));  // 0.8 (strips trailing zeros)
    const raw = value.toString();            // "0.8" or "1"
    // Deduplicate while preserving order
    return Array.from(new Set([v2, v1, trimmed, raw]));
  };

  // Build key candidates for shapes that use X*Y format
  const pairedKeyVariants = (x: number, y: number): string[] => {
    const xs = numberKeyVariants(x);
    const ys = numberKeyVariants(y);
    const combos: string[] = [];
    for (const xv of xs) {
      for (const yv of ys) {
        combos.push(`${xv}*${yv}`);
      }
    }
    return Array.from(new Set(combos));
  };

  const getFromPreset = (preset: PresetObject | undefined, candidates: string[]): string | undefined => {
    if (!preset) return undefined;
    for (const key of candidates) {
      if (key in preset) return preset[key];
    }
    return undefined;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseDiamondFile(text);

      if (parsed.length === 0) {
        alert("No diamond data found in the uploaded file. Please check the file format.");
        return;
      }

      const enriched = parsed.map(item => {
        const shapeKey = item.shape as keyof typeof sievePresets;

        // Build size-key candidate list tolerant to formatting differences
        const sizeKeyCandidates: string[] = (() => {
          if (shapeKey === 'Round') {
            return numberKeyVariants(item.size);
          }
          if (item.sizeY !== undefined) {
            return pairedKeyVariants(item.size, item.sizeY);
          }
          return numberKeyVariants(item.size);
        })();
        
        // Handle different key formats between presets
        const sievePreset = sievePresets[shapeKey] as PresetObject | undefined;
        const weightPreset = weightPresets[shapeKey] as PresetObject | undefined;
        
        const sieveSize = getFromPreset(sievePreset, sizeKeyCandidates) ?? "-";
        const avgWeightStr = getFromPreset(weightPreset, sizeKeyCandidates) ?? "-";
        const avgWeight = avgWeightStr === "-" ? "-" : parseFloat(avgWeightStr);
        const totalWeight = avgWeight === "-" ? 0 : avgWeight * item.quantity;
        
        return { ...item, sieveSize, avgWeight, totalWeight };
      });

      console.log("Enriched data:", enriched);
      setRows(enriched);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="mx-auto grid gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-white">Diamond Metrics</h1>
              <p className="mt-2 text-sm text-gray-300">Upload a plain-text export to parse and view enriched metrics.</p>
            </div>
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() => setRows([])}
                className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 border border-white/20"
              >
                Reset
              </button>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 p-8 hover:border-white/30 transition-colors">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">📄</div>
              <p className="text-sm text-gray-200 mb-4 text-center">
                Drag and drop your .txt file here, or select from your computer
              </p>
              <label className="relative inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-gray-900 font-medium shadow-sm hover:shadow transition-shadow cursor-pointer">
                <span>Choose file</span>
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
              <p className="mt-3 text-xs text-gray-300">Accepted format: .txt</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-white">
              <DataTable data={rows} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
