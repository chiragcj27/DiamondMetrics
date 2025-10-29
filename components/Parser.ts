export interface DiamondRow {
  quantity: number;
  shape: string;
  size: number;
  sizeY?: number; // For non-round shapes that have X*Y format
}

export const parseDiamondFile = (text: string): DiamondRow[] => {
  const lines = text.split("\n").filter((line) => line.includes("Diamond"));
  const data: DiamondRow[] = [];

  for (const line of lines) {
    // Skip lines that don't contain diamond data (like totals)
    if (line.includes("Total") || line.trim() === "") continue;
    
    const parts = line.split(",");
    
    // Check if we have enough parts and the line contains diamond data
    if (parts.length >= 6) {
      const quantity = parseInt(parts[0].trim());
      const shape = parts[2].trim();
      const xMatch = line.match(/X=([\d.]+)/);
      const yMatch = line.match(/Y=([\d.]+)/);

      if (xMatch && !isNaN(quantity) && shape) {
        const sizeX = parseFloat(xMatch[1]);
        const sizeY = yMatch ? parseFloat(yMatch[1]) : undefined;
        
        data.push({
          quantity,
          shape,
          size: sizeX,
          sizeY: sizeY,
        });
      }
    }
  }

  return data;
};
