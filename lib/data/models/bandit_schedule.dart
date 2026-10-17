class BanditWindow {
  const BanditWindow(this.hour, this.chance);

  final int hour;
  final double chance;
}

class BanditSchedule {
  static const Map<String, List<BanditWindow>> _schedules = {
    'west': [
      BanditWindow(1, .6),
      BanditWindow(3, .6),
      BanditWindow(5, .4),
      BanditWindow(7, .2),
      BanditWindow(11, .2),
      BanditWindow(13, .3),
      BanditWindow(15, .3),
      BanditWindow(17, .4),
      BanditWindow(19, .5),
      BanditWindow(21, .5),
      BanditWindow(23, .6),
    ],
    'east': [
      BanditWindow(2, .3),
      BanditWindow(5, .3),
      BanditWindow(7, .5),
      BanditWindow(9, .6),
      BanditWindow(11, .4),
      BanditWindow(13, .6),
      BanditWindow(15, .6),
      BanditWindow(17, .6),
      BanditWindow(19, .3),
      BanditWindow(21, .2),
    ],
    'europe': [
      BanditWindow(1, .3),
      BanditWindow(3, .2),
      BanditWindow(5, .2),
      BanditWindow(7, .2),
      BanditWindow(11, .4),
      BanditWindow(13, .5),
      BanditWindow(15, .5),
      BanditWindow(17, .6),
      BanditWindow(19, .6),
      BanditWindow(21, .6),
      BanditWindow(23, .5),
    ],
  };

  static List<BanditWindow> forRegion(String region) {
    final windows = _schedules[region];
    if (windows == null) {
      throw ArgumentError.value(region, 'region', 'Unsupported Albion server');
    }
    return windows;
  }

  static ({BanditWindow window, DateTime at}) nextWindow({
    required String region,
    required DateTime utcNow,
  }) {
    return forRegion(region)
        .map((window) {
          var at = DateTime.utc(
            utcNow.year,
            utcNow.month,
            utcNow.day,
            window.hour,
          );
          if (!at.isAfter(utcNow)) at = at.add(const Duration(days: 1));
          return (window: window, at: at);
        })
        .reduce((a, b) => a.at.isBefore(b.at) ? a : b);
  }
}
