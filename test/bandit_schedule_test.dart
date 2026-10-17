import 'package:flutter_test/flutter_test.dart';

import 'package:albionkit/data/models/bandit_schedule.dart';

void main() {
  test('next window uses the selected regional UTC schedule', () {
    final west = BanditSchedule.nextWindow(
      region: 'west',
      utcNow: DateTime.utc(2026, 10, 16, 2),
    );
    final east = BanditSchedule.nextWindow(
      region: 'east',
      utcNow: DateTime.utc(2026, 10, 16, 22),
    );

    expect(west.at, DateTime.utc(2026, 10, 16, 3));
    expect(west.window.chance, .6);
    expect(east.at, DateTime.utc(2026, 10, 17, 2));
    expect(east.window.chance, .3);
  });

  test('unsupported regions fail explicitly', () {
    expect(() => BanditSchedule.forRegion('unknown'), throwsArgumentError);
  });
}
