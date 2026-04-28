
async function findFactionIds() {
    const ITEMS_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json';
    console.log('Fetching items...');
    const response = await fetch(ITEMS_JSON_URL);
    const items = await response.json();

    const results = items.filter(item => {
        const id = item.UniqueName;
        return id.includes('TOKEN');
    });

    console.log(JSON.stringify(results.map(i => ({ id: i.UniqueName, name: i.LocalizedNames ? i.LocalizedNames['EN-US'] : 'No Name' })), null, 2));
}

findFactionIds();
