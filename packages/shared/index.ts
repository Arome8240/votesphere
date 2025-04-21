import { Connection, PublicKey } from "@solana/web3.js";

export const connectWallet = async (
  wallet: { publicKey: PublicKey | null },
  network: string = "devnet"
) => {
  const connection = new Connection(
    `https://api.${network}.solana.com`,
    "confirmed"
  );
  if (!wallet.publicKey) throw new Error("Wallet not connected");
  return { connection, publicKey: wallet.publicKey };
};
