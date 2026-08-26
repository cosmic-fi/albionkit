# Changelog

All notable changes to AlbionKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-25

### Added
- Guild Stats page with member search and fame analytics
- Guild Wars page with GvG match tracking and rivalries
- Guild detail page `/guild/[id]` with stats and member table
- Enhanced Bot page with features, FAQ, and tech stack
- About page with developer story and donation CTA
- Real-time killboard data trimming for faster loads
- Fame ratio calculation fix for edge cases
- Dynamic guild search with autocomplete

### Changed
- [MAJOR] - Migration from NextJs to Sveltekit
- Simplified UI across all pages - removed shadows, gradients, and excessive padding
- Removed unused slug-based guide routes
- Updated all locales to use AlbionKit branding
- Reduced API payload sizes for killboard and guild data
- And many more

### Fixed
- Duplicate client-side fetch calls on killboard page
- Guild info route not resolving after navigation
- FAQ section not rendering on Bot page
- Guild wars API timeout issues with large limit values
- Fame ratio display showing incorrect values for 0 death players

## [1.0.0] - 2026-03-31

### Added
- Translation guide for i18n contributions
- Code of Conduct
- Security policy

### Changed
- Cleaned up internal development documentation

### Removed
- Internal competitive analysis documents
- Internal implementation guides
- One-time migration scripts

### Fixed
- 30+ Bugs fixed
- Type safety issues across the codebase
- Missing type definitions
- Unused imports and exports

## [0.1.0] - 2026-01-01

### Added
- Gold price tracker
- Market Flipper tool
- Profit calculators (Farming, Cooking, Alchemy, etc.)
- PvP Intel tracker
- ZvZ Tracker
- Killboard
- Build database
- Multi-language support (10 languages)
- PWA support

---
