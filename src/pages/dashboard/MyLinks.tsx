// src/lib/shortio.ts - Add this function

// ✅ Batch fetch function
export async function getShortIoStatsBatch(shortCodes: string[]): Promise<Record<string, { totalClicks: number }>> {
  if (!shortCodes.length) return {};
  
  try {
    const response = await fetch(`/api/stats/batch?shortCodes=${shortCodes.join(',')}`);
    
    if (!response.ok) {
      console.error('Batch API error:', await response.text());
      return {};
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    return {};
  }
}