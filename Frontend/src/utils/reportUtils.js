export function generateMonthlyBorrowReport(requests) {
  const report = {}

  requests.forEach((req) => {
    if (!req.startDate || !req.item) return
    const date = new Date(req.startDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!report[monthKey]) {
      report[monthKey] = { count: 0, assets: [] }
    }
    report[monthKey].count += 1
    report[monthKey].assets.push(req.item.name || "Unknown")
  })

  return report
}