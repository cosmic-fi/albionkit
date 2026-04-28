const fs = require('fs');
const path = 'z:/Projects/Apps/Mvp project/ao-pocket/messages/en.json';
const content = fs.readFileSync(path, 'utf8').trim();

// Remove the last '}'
const newContent = content.substring(0, content.lastIndexOf('}')) + `  },
  "FactionEfficiencyPage": {
    "title": "Faction Reward Efficiency - Albion Online",
    "description": "Calculate the most profitable items to buy with your Faction Points. Compare hearts, crests, and mounts across all royal cities."
  },
  "HeartTransportPage": {
    "title": "Heart Transport Profitability - Albion Online",
    "description": "Calculate net profits for city-to-city heart transports. Account for market taxes and transport fees."
  },
  "BanditTrackerPage": {
    "title": "Bandit Assault Tracker - Albion Online",
    "description": "Live countdown and notification system for the next Bandit Assault event in the Outlands."
  },
  "CampaignTrackerPage": {
    "title": "Campaign Progress Tracker - Albion Online",
    "description": "Track your monthly faction campaign progress and see how many points you need to reach your goal."
  },
  "FactionTools": {
    "efficiency": {
      "title": "Faction Reward Efficiency",
      "subtitle": "Maximize your Silver per Point",
      "points": "Points",
      "spp": "Silver / Point",
      "price": "Market Price",
      "bestRewards": "Best Rewards",
      "allFactions": "All Factions",
      "selectFaction": "Filter by Faction",
      "efficiencyTable": "Efficiency Table",
      "reward": "Reward",
      "category": "Category",
      "item": "Item",
      "tier": "Tier",
      "faction": "Faction",
      "lastUpdated": "Last Updated",
      "efficiency": "Efficiency"
    },
    "transport": {
      "title": "Heart Transport Profitability",
      "subtitle": "City-to-City Trade Matrix",
      "source": "Source City",
      "destination": "Destination City",
      "profit": "Net Profit",
      "roi": "ROI",
      "calculate": "Calculate Profit",
      "selectHearts": "Select Heart Type"
    },
    "bandit": {
      "title": "Bandit Assault Tracker",
      "subtitle": "Next Event Countdown",
      "nextAssault": "Next Potential Assault",
      "status": "Current Status",
      "active": "Event Active!",
      "waiting": "Waiting for Timer",
      "imminent": "Imminent (Any Minute)",
      "notify": "Notify Me",
      "history": "Recent Bandit History"
    },
    "campaign": {
      "title": "Campaign Progress Tracker",
      "subtitle": "Monthly Point Projections",
      "goal": "Monthly Goal",
      "current": "Current Points",
      "required": "Daily Points Required",
      "remaining": "Points Remaining",
      "projection": "Monthly Projection"
    }
  }
}
`;

fs.writeFileSync(path, newContent);
console.log('Successfully updated en.json');
