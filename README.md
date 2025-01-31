# VerifyInfluencers - Health Claims Verification Platform

A platform that analyzes and verifies health claims made by influencers using AI and scientific research.

## Features

- **Influencer Discovery & Analysis**: Search and analyze health influencers' content
- **Automated Claim Extraction**: AI-powered identification of health claims
- **Scientific Verification**: Cross-reference claims with trusted journals
- **Trust Score System**: Dynamic scoring based on claim verification
- **Interactive Dashboard**: Real-time stats and leaderboard
- **Research Configuration**: Customizable analysis parameters

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **AI Integration**: OpenAI GPT-4, Perplexity AI

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

3. Configure environment variables:

```env
MONGODB_URI=your_mongodb_uri
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
```

4. Start the servers:

```bash
# Backend
cd server && npm start

# Frontend
cd client && npm run dev
```

## API Endpoints

- `/api/influencers`: Influencer management
- `/api/claims`: Claim analysis and verification
- `/api/journals`: Scientific journal references

## Future Enhancements

- Real-time content monitoring
- Enhanced verification algorithms
- Community feedback system
- API rate limiting and caching
- Mobile app integration

## Contributing

Contributions welcome! Please read our contributing guidelines first.
