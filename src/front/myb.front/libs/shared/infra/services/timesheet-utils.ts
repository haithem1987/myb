export function getTotalQuantityForProject(
  projectId: number,
  timesheetQuantities: { [key: string]: number },
  totalPeriod: number
): number {
  let total = 0;
  let datesChecked = 0;
  for (const [key, quantity] of Object.entries(timesheetQuantities)) {
    if (datesChecked >= totalPeriod) {
      break;
    }
    if (key.startsWith(`${projectId}.`) && quantity > 0) {
      total++;
      datesChecked++;
    }
  }
  return total;
}
