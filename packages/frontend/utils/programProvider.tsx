import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../backend/target/idl/backend.json";
import { Backend } from "../../backend/target/types/backend";
import { useMemo } from "react";

export function useProgramProvider(
  publicKey: PublicKey | null,
  signTransaction: any,
  connection: Connection | null
) {
  return useMemo(() => {
    if (!publicKey || !signTransaction || !connection) return null;

    return new Program<Backend>(
      idl as any,
      new AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction,
          sendTransaction: connection.sendTransaction,
        } as unknown as Wallet,
        { commitment: "processed" }
      )
    );
  }, [publicKey, signTransaction, connection]);
}
