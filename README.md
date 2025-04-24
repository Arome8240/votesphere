# VoteSphere: Decentralized Voting on Solana

## Description

VoteSphere is a mobile application built on the Solana blockchain, enabling users to create and participate in polls with secure, transparent voting. Only users holding a specific SPL token can vote, ensuring controlled access. The project is organized as a monorepo with a Rust-based Solana smart contract backend (using Anchor) and a React Native frontend, styled with Gluestack-UI for a mobile-friendly experience.

## Table of Contents

- [VoteSphere: Decentralized Voting on Solana](#votesphere-decentralized-voting-on-solana)
  - [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Setup and Configuration](#setup-and-configuration)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

## Prerequisites

To set up and run VoteSphere, install the following tools:

- **Rust**: For building the Solana backend. Install via [rustup](https://rustup.rs/).
- **Solana CLI**: For interacting with the Solana blockchain. Install via [Solana CLI Guide](https://docs.solana.com/cli/install-solana-cli-tools).
- **Anchor**: For developing Solana programs. Install with:
  ```bash
  cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
  ```
- **Node.js**: Version 18 or later for the React Native frontend. Install via [Node.js](https://nodejs.org/en/download/).
- **Yarn**: For managing dependencies. Install with:
  ```bash
  npm install -g yarn
  ```
- **React Native CLI**: For building React Native apps. Install with:
  ```bash
  npm install -g react-native-cli
  ```
- **Xcode** (for iOS) or **Android Studio** (for Android): For building and running the mobile app. Download from [Xcode](https://developer.apple.com/xcode) or [Android Studio](https://developer.android.com/studio).

## Installation

Follow these steps to install and set up VoteSphere:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/votesphere-monorepo.git
   cd votesphere-monorepo
   ```

2. **Install Dependencies**:
   Install all dependencies for the monorepo using Yarn Workspaces:

   ```bash
   yarn install
   ```

3. **Build the Backend**:
   Build the Solana smart contract:

   ```bash
   yarn build:backend
   ```

   This runs `anchor build` in the `packages/votesphere-backend` directory, generating the program and IDL.

4. **Deploy the Backend**:
   Deploy the Solana program to devnet:

   ```bash
   yarn deploy:backend
   ```

   Note the program ID outputted during deployment (e.g., `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`).

5. **Copy the IDL to the Frontend**:
   Copy the generated IDL file to the frontend directory:

   ```bash
   cp packages/votesphere-backend/target/idl/votesphere.json packages/votesphere-frontend/src/idl/
   ```

6. **Update the Program ID in the Frontend**:
   Open `packages/votesphere-frontend/src/VoteScreen.tsx` and replace the hardcoded program ID (`'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'`) with the deployed program ID from step 4.

7. **Start the Frontend**:
   Start the React Native development server:

   ```bash
   yarn start:frontend
   ```

8. **Run on Your Device**:
   - For iOS:
     ```bash
     yarn ios
     ```
   - For Android:
     ```bash
     yarn android
     ```

## Setup and Configuration

- **Solana Wallet**: Ensure you have a Solana wallet (e.g., Phantom) with devnet SOL for transaction fees. Get devnet SOL from [Solana Faucet](https://solfaucet.com/).
- **Mobile Wallet**: Install a mobile wallet like Phantom on your device to connect to the app.
- **Solana Network**: Configure Solana CLI to use devnet:
  ```bash
  solana config set --url devnet
  ```
- **Monorepo Structure**: The project uses Yarn Workspaces to manage three packages:
  - `votesphere-backend`: Solana smart contract (Rust/Anchor).
  - `votesphere-frontend`: React Native app.
  - `shared`: Shared utilities for Solana interactions.

## Usage

1. **Connect Your Wallet**:

   - Open the VoteSphere app on your device or emulator.
   - Connect your Solana wallet (e.g., Phantom) when prompted.

2. **Create a Poll**:

   - Navigate to the "Create Poll" screen.
   - Enter a poll question (e.g., "Best programming language?").
   - Add up to 10 options (e.g., "Rust", "Python").
   - Specify the SPL token mint address required for voting.
   - Click "Create Poll" to deploy the poll on Solana.
   - The app will display the poll address (e.g., a public key), which you can share with voters.

3. **Vote on a Poll**:
   - Navigate to the "Vote" screen.
   - Enter the poll address provided by the poll creator.
   - Select your preferred option from the list.
   - Click "Cast Vote" to submit your vote.
   - Ensure your wallet holds at least one of the required SPL tokens to vote.

**Note**: If you encounter errors, verify that the program ID in the frontend matches the deployed backend and that the IDL file is correctly placed.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes, ensuring they follow Rust and React Native best practices.
4. Submit a pull request with a clear description of your changes.

Please include tests and documentation for any new features or fixes.

## License

This project is licensed under the MIT License. See the [MIT](MIT) file for details.

## Contact

For questions or feedback, contact me at [arome8240@gmail.com] or [Twitter](https://x.com/aromedev).
