# Translation Status

Last updated: 2026-08-25

| Locale | Language | Translated | Total | Progress |
|--------|----------|------------|-------|----------|
| en | English | 3536 | 3536 | 100% |
| de | German | 3139 | 3536 | 89% |
| fr | French | 2542 | 3536 | 72% |
| ru | Russian | 2438 | 3536 | 69% |
| pl | Polish | 2373 | 3536 | 67% |
| es | Spanish | 2386 | 3536 | 67% |
| tr | Turkish | 2401 | 3536 | 68% |
| zh | Chinese | 2425 | 3536 | 69% |
| ko | Korean | 2472 | 3536 | 70% |

## How to Help

Want to help translate? Here's how:

1. Open the locale file you want to update (e.g. `fr.json`, `de.json`)
2. Find keys that still have English values (they will match `en.json`)
3. Replace only the string values with translations
4. Keep all placeholders like `{name}`, `{count}`, `{region}` intact
5. Do NOT change any keys or JSON structure

## Translation Guidelines

- Keep gaming terminology consistent with Albion Online's official German/French/etc. translations where possible
- Preserve placeholders exactly: `{name}`, `{count}`, `{region}`, `{trend}`, `{n}`, `{itemName}`, `{price}`, `{change}`, `{roi}`, `{buyPrice}`, `{sellPrice}`, `{quantity}`, `{hours}`, `{cycles}`, `{profit}`, `{tier}`, `{enchant}`, `{item}`, `{current}`, `{total}`, `{time}`, `{rate}`, `{range}`, `{start}`, `{end}`, `{killer}`, `{victim}`, `{fame}`, `{query}`, `{cost}`, `{revenue}`, `{yield}`, `{consumption}`, `{offspring}`, `{growth}`, `{babyPrice}`, `{adultPrice}`, `{foodPrice}`, `{productPrice}`, `{meatPrice}`, `{seedPrice}`, `{producePrice}`, `{plots}`, `{cycles}`, `{returnRate}`, `{stationFee}`, `{journalProfit}`, `{sellOrder}`, `{profitPerFocus}`, `{buyMethod}`, `{sellMethod}`, `{customRRR}`, `{usageFee}`, `{dailyBonus}`, `{buyCity}`, `{sellCity}`, `{premium}`, `{focus}`, `{favoriteFood}`, `{buyFrom}`, `{sellAt}`, `{baby}`, `{adult}`, `{food}`, `{product}`, `{meat}`, `{crop}`, `{herb}`, `{seed}`, `{produce}`, `{tier8}`, `{tier7}`, `{tier6}`, `{category}`, `{quality}`, `{price}`, `{vol}`, `{profit}`, `{margin}`, `{travelCost}`, `{estCost}`, `{growthValue}`, `{offspringChance}`, `{profitPlot}`, `{yieldLabel}`, `{estCost}`, `{favFoodLabel}`, `{genericFood}`, `{vol24h}`, `{cycleUnits}`, `{totalUnits}`, `{perUnit}`, `{perCycle}`, `{lowStock}`, `{itemId}`, `{unitCost}`, `{effectiveRrr}`, `{material}`, `{source}`, `{totalCost}`, `{netProfit}`, `{grossProfit}`, `{marketTaxes}`, `{avgDailyVolume}`, `{comparisonOfAvgPrices}`, `{lastUpdatedLabel}`, `{buyDetails}`, `{sellDetails}`, `{locationLabel}`, `{priceLabel}`, `{buyPriceAt}`, `{sellPriceAt}`, `{silver_lower}`, `{opportunities_lower}`, `{profitableOpportunitiesFound}`, `{failedToLoadData}`, `{categoryLabel}`, `{tierLabel}`, `{allTiersLabel}`, `{searchItemLabel}`, `{searchItemPlaceholder}`, `{travelCostLabel}`, `{premiumAccount}`, `{fetchingPrices}`, `{errorLoadingData}`, `{profitableOpportunities}`, `{marginLabel}`, `{roiLabel}`, `{dailyVolumeLabel}`, `{lastUpdatedLabel}`, `{buyDetails}`, `{sellDetails}`, `{locationLabel}`, `{priceLabel}`, `{priceHistoryTitle}`, `{totalFlips}`, `{avgProfit}`, `{marketStatus}`, `{active}`, `{liveUpdates}`, `{fetchingData}`, `{opportunities_lower}`, `{silver_lower}`, `{profitableOpportunitiesFound}`, `{failedToLoadData}`
- Keep HTML tags like `<strong>`, `<br>`, `<em>` intact
- Keep emojis intact
- Keep URLs intact
- If a term is commonly used in English in the game community (like "ROI", "DPS", "IP"), you may keep it as-is

## File Structure

Each locale file is a flat JSON object with nested keys. Example:

```json
{
  "Common": {
    "online": "Online",
    "offline": "Offline"
  },
  "Pages": {
    "home": {
      "title": "Home"
    }
  }
}
```

## Testing

After translating, you can test by changing the locale in the app settings. The app will fall back to English for any missing keys.

## Questions?

Open an issue on GitHub or reach out on Discord.
