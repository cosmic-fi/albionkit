enum AlbionServerRegion { west, east, europe }

enum AlbionServerAvailability { online, offline, maintenance }

String albionServerRegionDisplayName(String region) =>
    switch (region.toLowerCase()) {
      'west' => 'West (Americas)',
      'east' => 'East (Asia)',
      'europe' => 'Europe',
      _ =>
        region.isEmpty
            ? region
            : '${region[0].toUpperCase()}${region.substring(1)}',
    };

class AlbionServerStatus {
  const AlbionServerStatus({required this.region, required this.availability});

  final AlbionServerRegion region;
  final AlbionServerAvailability availability;

  factory AlbionServerStatus.fromJson(Map<String, dynamic> json) {
    final regionValue = json['region'];
    final statusValue = json['status'];
    final region = AlbionServerRegion.values.where(
      (value) => value.name == regionValue,
    );
    final availability = AlbionServerAvailability.values.where(
      (value) => value.name == statusValue,
    );
    if (region.isEmpty || availability.isEmpty) {
      throw const FormatException('Invalid Albion server status');
    }
    return AlbionServerStatus(
      region: region.single,
      availability: availability.single,
    );
  }
}

class AlbionKitApiStatus {
  const AlbionKitApiStatus({
    required this.name,
    required this.version,
    required this.status,
    required this.servers,
  });

  final String name;
  final String version;
  final String status;
  final List<AlbionServerStatus> servers;

  factory AlbionKitApiStatus.fromEnvelope(Map<String, dynamic> json) {
    final data = json['data'];
    if (data is! Map) {
      throw const FormatException('Missing API status data');
    }
    final payload = Map<String, dynamic>.from(data);
    final name = payload['name'];
    final version = payload['version'];
    final status = payload['status'];
    final servers = payload['servers'];
    if (name is! String ||
        version is! String ||
        status is! String ||
        servers is! List) {
      throw const FormatException('Invalid API status response');
    }

    return AlbionKitApiStatus(
      name: name,
      version: version,
      status: status,
      servers: servers.map((server) {
        if (server is! Map) {
          throw const FormatException('Invalid Albion server status');
        }
        return AlbionServerStatus.fromJson(Map<String, dynamic>.from(server));
      }).toList(),
    );
  }
}
