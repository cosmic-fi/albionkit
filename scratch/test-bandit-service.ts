import { getNextWindow, getRemainingTime, getBanditStatus } from '../src/lib/bandit-service';

function test() {
  console.log('--- Bandit Service Logic Test ---');

  // Mocking 22:30 UTC for West (Americas)
  // Next window should be 23:00 UTC today
  const currentTime1 = new Date();
  currentTime1.setUTCHours(22, 30, 0, 0);
  const result1 = getNextWindow('west', currentTime1);
  const remaining1 = getRemainingTime(result1.targetDate, currentTime1);
  const status1 = getBanditStatus(remaining1, currentTime1);

  console.log('Test 1 (22:30 UTC West):');
  console.log('Next Hour:', result1.window.utcHour);
  console.log('Target Date:', result1.targetDate.toUTCString());
  console.log('Remaining (ms):', remaining1);
  console.log('Status:', status1);
  console.log('---');

  // Mocking 23:30 UTC for West
  // Next window should be 01:00 UTC tomorrow
  const currentTime2 = new Date();
  currentTime2.setUTCHours(23, 30, 0, 0);
  const result2 = getNextWindow('west', currentTime2);
  const remaining2 = getRemainingTime(result2.targetDate, currentTime2);
  const status2 = getBanditStatus(remaining2, currentTime2);

  console.log('Test 2 (23:30 UTC West - Day Wrap):');
  console.log('Next Hour:', result2.window.utcHour);
  console.log('Target Date:', result2.targetDate.toUTCString());
  console.log('Remaining (ms):', remaining2);
  console.log('Status:', status2);
  console.log('---');

  // Mocking 01:05 UTC for West
  // Since it's within first 10 mins of the 01:00 window
  const currentTime3 = new Date();
  currentTime3.setUTCHours(1, 5, 0, 0);
  // getNextWindow will find 03:00 as the next one
  const result3 = getNextWindow('west', currentTime3);
  // But if we check the status of a past window manually or simulate being in the window:
  const targetDate3 = new Date(currentTime3);
  targetDate3.setUTCHours(1, 0, 0, 0);
  const remaining3 = getRemainingTime(targetDate3, currentTime3);
  const status3 = getBanditStatus(remaining3, currentTime3);

  console.log('Test 3 (01:05 UTC West - Inside Rolling Window):');
  console.log('Simulated Target:', targetDate3.toUTCString());
  console.log('Remaining (ms):', remaining3);
  console.log('Status:', status3);
  console.log('---');
}

test();
