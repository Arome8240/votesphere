import { Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Backend } from "../../backend/target/types/backend";
import idl from "../../backend/target/idl/backend.json";
import { useConnection } from "./ConnectionProvider";
import { useAnchorWallet } from "./useAnchorWallet";
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Poll } from "./interfaces";

// Create a poll
// const createPoll = async (
//   program: Program<Backend>,
//   publicKey: PublicKey,
//   nextCount: BN,
//   description: string,
//   start: number,
//   end: number
// ): Promise<string> => {
//   const [counterPDA] = PublicKey.findProgramAddressSync(
//     [Buffer.from("counter")],
//     programId
//   );
//   const [pollPDA] = PublicKey.findProgramAddressSync(
//     [nextCount.toArrayLike(Buffer, "le", 8)],
//     programId
//   );

//   return await program.methods
//     .createPoll(description, new BN(start), new BN(end))
//     .accountsPartial({
//       user: publicKey,
//       counter: counterPDA,
//       poll: pollPDA,
//       systemProgram: SystemProgram.programId,
//     })
//     .rpc();
// };

// Future hooks can be added here, like:
// - fetchPoll
// - voteOnPoll
// - closePoll

const POLL_PROGRAM_ID = "Ar2FG8HLgS71AgzTs7nHWB5wQPi6sTh3EHJyfRsbHp2y";

export const usePoll = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const pollProgramId = useMemo(() => new PublicKey(POLL_PROGRAM_ID), []);

  const [counterPDA] = useMemo(() => {
    const counterSeed = anchor.utils.bytes.utf8.encode("counter");
    return PublicKey.findProgramAddressSync([counterSeed], pollProgramId);
  }, [pollProgramId]);

  const provider = useMemo(() => {
    if (!anchorWallet) return;
    return new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: "confirmed",
      commitment: "processed",
    });
  }, [anchorWallet, connection]);

  const program = useMemo(() => {
    if (!provider) return;
    return new Program<Backend>(idl as Backend, provider);
  }, [provider, pollProgramId]);

  const polls = useQuery({
    queryKey: ["poll"],
    enabled: !!program,
    queryFn: async (): Promise<Poll[]> => {
      if (!program) {
        console.log("No Program");
        return [];
      }
      const polls = await program.account.poll.all();

      const serializedPolls = serializedPoll(polls);

      return serializedPolls;
    },
  });

  const serializedPoll = (polls: any[]): Poll[] =>
    polls.map((c: any) => {
      //console.log("Raw Poll Data:", c.account);
      return {
        ...c.account,
        publicKey: c.publicKey.toBase58(),
        id: c.account.id.toNumber(),
        start: c.account.start.toNumber() * 1000,
        end: c.account.end.toNumber() * 1000,
        candidates: c.account.candidates.toNumber(),
      };
    });

  const count = useQuery({
    queryKey: ["counter"],
    queryFn: async () => {
      if (!program) return null;
      let counts = await program.account.counter.fetch(counterPDA);
      console.log("My Counts", counts);
      return counts;
    },
  });

  const createCounter = useMutation({
    mutationKey: ["counter", "create"],
    mutationFn: async () => {
      if (!program || !anchorWallet?.publicKey) {
        throw new Error("Poll program not ready");
      }

      try {
        const existing = await program.account.counter.fetch(counterPDA);
        console.log("Counter already exists:", existing);
        return;
      } catch (e) {
        console.log("Counter not found, creating...");
      }

      return await program.methods
        .initialize() // Or whatever your instruction is named
        .accountsPartial({
          user: anchorWallet.publicKey,
          counter: counterPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: () => {
      count.refetch();
    },
    onError: (err: Error) =>
      console.error("Error creating counter:", err.message),
  });

  const createPoll = useMutation({
    mutationKey: ["poll", "create"],
    mutationFn: async ({
      description,
      start,
      end,
    }: {
      description: string;
      start: number;
      end: number;
    }) => {
      if (!program || !anchorWallet?.publicKey || !count.data?.count) {
        console.log("program:", program);
        console.log("wallet:", anchorWallet?.publicKey?.toBase58());
        console.log("count data:", count.data);
        throw new Error("Poll program not ready");
      }

      const nextCount = new BN(count.data.count.toNumber() + 1);
      const [pollPDA] = PublicKey.findProgramAddressSync(
        [nextCount.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      return await program.methods
        .createPoll(description, new BN(start), new BN(end))
        .accountsPartial({
          user: anchorWallet.publicKey,
          counter: counterPDA,
          poll: pollPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: async (sig: string) => {
      console.log("Poll created with signature:", sig);
      await polls.refetch();
    },

    onError: (error: Error) =>
      console.error("Poll Creation Error", error.message),
  });

  return {
    count,
    createPoll,
    polls,
    createCounter,
    // fetchPoll,
    // voteOnPoll,
    // closePoll,
  };
};
