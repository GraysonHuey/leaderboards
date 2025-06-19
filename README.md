# BandScore - Section Leaderboard System

A beautiful web application for tracking band section performance and member rankings.

## Features

- 🏆 **Section Leaderboards** - Track performance across different instrument sections
- 👥 **Member Rankings** - Individual member point tracking within sections
- 🔐 **Admin Panel** - Manage users, assign sections, and update points
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔥 **Real-time Updates** - Powered by Firebase for instant synchronization

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore)
- **Icons**: Lucide React
- **Routing**: React Router
- **Build Tool**: Vite

## Live Demo

🚀 **[View Live App](https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/)**

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment to GitHub Pages

This app automatically deploys to GitHub Pages using GitHub Actions:

### Setup Steps:

1. **Create GitHub Repository**:
   - Create a new public repository on GitHub
   - Push your code to the repository

2. **Add Firebase Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add these repository secrets:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"

4. **Update Firebase Settings**:
   - In Firebase Console → Authentication → Settings → Authorized domains
   - Add: `YOUR_USERNAME.github.io`

5. **Update Vite Config**:
   - Replace `YOUR_REPO_NAME` in `vite.config.ts` with your actual repository name

### Automatic Deployment:
- Every push to `main` branch triggers automatic deployment
- Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## Usage

### For Members
- Sign in with Google
- View section leaderboards
- Track your ranking within your section

### For Admins
- Access the admin panel
- Assign users to sections
- Add/subtract points with reasons
- Manage all users and sections

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Collaboration

To add collaborators:
1. Go to repository Settings → Manage access
2. Click "Invite a collaborator"
3. To make someone an admin in the app, update their role in Firebase Console

## License

This project is licensed under the MIT License.