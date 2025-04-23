import { useEffect, useState } from "react";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Backend } from "../../backend/target/types/backend";
import { BN } from "@coral-xyz/anchor";

interface CounterState {
  data: { count: BN } | null;
  loading: boolean;
  error: string | null;
}

export const useCounterProgram = (program?: Program<Backend>) => {
  const [counterAccount, setCounterAccount] = useState<CounterState>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!program) return;

    const fetchCounter = async () => {
      setCounterAccount({ data: null, loading: true, error: null });

      try {
        const [counterPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("counter")],
          program.programId
        );
        const counter = await program.account.counter.fetch(counterPDA);

        setCounterAccount({
          data: { count: counter?.count ?? new BN(0) },
          loading: false,
          error: null,
        });
      } catch (e) {
        console.error("Error fetching counter", e);
        setCounterAccount({
          data: null,
          loading: false,
          error: "Failed to fetch counter",
        });
      }
    };

    fetchCounter();
  }, [program]);

  return { counterAccount };
};
