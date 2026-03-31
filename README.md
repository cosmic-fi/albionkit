# AlbionKit - Albion Online Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)

A comprehensive toolkit for Albion Online players featuring market analysis, build databases, PvP intelligence, and profit calculators.

## 🎯 Features

### Market Tools
- **Market Flipper** - Real-time arbitrage opportunities across all cities
- **Gold Price Tracker** - Monitor gold market trends and history
- **Price Alerts** - Get notified for profitable market opportunities

### Profit Calculators
- **Crafting Calculator** - Calculate crafting profits with return rates
- **Farming Profits** - Crop and animal yield calculator
- **Cooking Profits** - Food crafting profitability
- **Alchemy Profits** - Potion brewing calculator
- **Animal Breeding** - Breeding profit calculator
- **Enchanting Profits** - Enchanting success rate calculator
- **Labourer Profits** - Labourer yield calculator
- **Chopped Fish Profits** - Fish processing calculator

### PvP Tools
- **PvP Intel** - Player statistics, killboards, and battle analysis
- **Killboard** - Real-time kill notifications
- **ZvZ Tracker** - Large-scale battle analytics and leaderboards

### Build Database
- **Character Builds** - Community-submitted builds for all game modes
- **Build Sharing** - Share and discover meta builds
- **Equipment Planner** - Plan your gear setups

### Additional Features
- **Multi-language Support** - Available in 10+ languages
- **PWA Support** - Install as a progressive web app
- **Dark/Light Theme** - Customizable UI themes

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Albion Online API access (via Albion Data Project)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/albionkit.git
   cd albionkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and fill in your API keys:
   - Firebase credentials (Optional)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
albionkit/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── tools/           # Market flipper, PvP intel, ZvZ tracker
│   │   ├── profits/         # Profit calculators
│   │   ├── builds/          # Build database
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── [feature]/       # Feature-specific components
│   ├── lib/                 # Utility libraries and services
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React Context providers
│   ├── i18n/                # Internationalization config
│   └── data/                # Static data files
├── messages/                # Translation files (10 languages)
├── public/                  # Static assets
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **UI:** React 19 with Tailwind CSS 4
- **State:** React Context + Custom Hooks
- **Backend:** Firebase (Auth + Firestore)
- **i18n:** next-intl
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel

## 🌍 Internationalization

AlbionKit supports 10 languages:

- English (en)
- German (de)
- Spanish (es)
- French (fr)
- Korean (ko)
- Polish (pl)
- Portuguese (pt)
- Russian (ru)
- Turkish (tr)
- Chinese (zh)

See [docs/TRANSLATION_GUIDE.md](docs/TRANSLATION_GUIDE.md) for contribution guidelines.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute

- 🌍 **Translations** - Help translate the app to more languages
- 🐛 **Bug Reports** - Submit issues for bugs you find
- 💡 **Feature Requests** - Suggest new features
- 📝 **Documentation** - Improve docs and guides
- 💻 **Code** - Submit PRs for features or fixes

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Development Setup](docs/DEVELOPMENT.md)
- [Translation Guide](docs/TRANSLATION_GUIDE.md)
- [Open Source Guide](docs/OPEN_SOURCE_GUIDE.md)

## 🔒 Security

Please review our [Security Policy](SECURITY.md) for reporting vulnerabilities.

**Important:** Never commit `.env.local` or any file containing API keys to version control.

## 🙏 Sponsors

Support this project by becoming a sponsor!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/cosmic_fi)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-ea4aaa?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/cosmic-fi)

Your support helps keep AlbionKit free and ad-free for everyone!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Albion Online by Sandbox Interactive
- Albion Data Project for API access
- All contributors and supporters

## 📞 Support

- **Discord:** (Coming soon!)
- **Twitter:** [@Albion_Kit](https://twitter.com/Albion_Kit)
- **Email:** support@albionkit.com

---

Built with ❤️ for Albion Online Community by Cosmic-fi (Albion Team)
