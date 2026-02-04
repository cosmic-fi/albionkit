
const WEAPONS = [
  'T4_MAIN_SWORD', 'T6_MAIN_DAGGER', 'T8_MAIN_CURSEDSTAFF', 
  'T5_MAIN_AXE', 'T7_MAIN_MACE', 'T4_MAIN_SPEAR',
  'T6_MAIN_HOLYSTAFF', 'T8_MAIN_FIRESTAFF', 'T5_MAIN_BOW',
  'T7_2H_CROSSBOW'
];

export function generateFakeCombatEvents(count: number = 50, type: 'kill' | 'death') {
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Random time within last 24 hours
    const time = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    
    // Random Fame (10k to 10m)
    const fame = Math.floor(Math.random() * 10000000) + 10000;
    
    // Random IP (900 to 1800)
    const ip = Math.floor(Math.random() * 900) + 900;
    
    // Random Weapons
    const weapon1 = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
    const weapon2 = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];

    const equipment1 = {
      MainHand: {
        Type: weapon1,
        Count: 1,
        Quality: 1
      }
    };

    const equipment2 = {
      MainHand: {
        Type: weapon2,
        Count: 1,
        Quality: 1
      }
    };
    
    events.push({
      EventId: Math.floor(Math.random() * 100000000),
      TimeStamp: time.toISOString(),
      TotalVictimKillFame: fame,
      Killer: {
        Name: type === 'death' ? `Killer_${Math.floor(Math.random()*1000)}` : 'You',
        AverageItemPower: type === 'death' ? ip + 100 : ip,
        Equipment: equipment1
      },
      Victim: {
        Name: type === 'kill' ? `Victim_${Math.floor(Math.random()*1000)}` : 'You',
        AverageItemPower: ip,
        Equipment: equipment2
      }
    });

    // Note: calculateMastery logic:
    // Kills: weapon = kill.Killer.Equipment?.MainHand?.Type
    // Deaths: weapon = death.Victim.Equipment?.MainHand?.Type
    // So if type is 'kill', 'You' are Killer, so Killer needs equipment.
    // If type is 'death', 'You' are Victim, so Victim needs equipment.
  }
  
  return events.sort((a, b) => new Date(b.TimeStamp).getTime() - new Date(a.TimeStamp).getTime());
}
