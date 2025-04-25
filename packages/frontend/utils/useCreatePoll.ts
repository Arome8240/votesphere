import { Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Backend } from "../../backend/target/types/backend";
import idl from "../../backend/target/idl/backend.json";
import { useConnection } from "./ConnectionProvider";
import { useAnchorWallet } from "./useAnchorWallet";
import { useMemo } from "react";
import * as anchor from "@coral-xyz/anchor";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Candidate, Poll } from "./interfaces";

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

export const usePoll = (pollAddress?: string) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const pollProgramId = useMemo(() => new PublicKey(POLL_PROGRAM_ID), []);

  const [counterPDA] = useMemo(() => {
    const counterSeed = anchor.utils.bytes.utf8.encode("counter");
    return PublicKey.findProgramAddressSync([counterSeed], pollProgramId);
  }, [pollProgramId]);

  const [voterPDA] = useMemo(() => {
    const voterSeed = anchor.utils.bytes.utf8.encode("voter");

    return PublicKey.findProgramAddressSync([voterSeed], pollProgramId);
  }, [pollProgramId]);

  const [pollPDA] = useMemo(() => {
    const pollSeed = anchor.utils.bytes.utf8.encode("poll");

    return PublicKey.findProgramAddressSync([pollSeed], pollProgramId);
  }, [pollProgramId]);

  const [registerPDA] = useMemo(() => {
    const registerSeed = anchor.utils.bytes.utf8.encode("registerations");

    return PublicKey.findProgramAddressSync([registerSeed], pollProgramId);
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

  const count = useQuery({
    queryKey: ["counter"],
    queryFn: async () => {
      if (!program) return null;
      let counts = await program.account.counter.fetch(counterPDA);
      //console.log("My Counts", counts);
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

  const pollDetail = useQuery({
    queryKey: ["poll-detail", pollAddress],
    enabled: !!program && !!pollAddress,
    queryFn: async (): Promise<Poll | null> => {
      if (!pollAddress) throw new Error("Poll address is required");
      const address = new PublicKey(pollAddress);

      //console.log(address, pollAddress);

      const poll = await program?.account.poll.fetch(address);

      if (!poll) throw new Error("Poll not found");

      const serialized: Poll = {
        ...poll,
        publicKey: pollAddress,
        id: poll.id.toNumber(),
        start: poll.start.toNumber() * 1000,
        end: poll.end.toNumber() * 1000,
        candidates: poll.candidates.toNumber(),
      };

      return serialized;
    },
  });

  const candidates = useQuery({
    queryKey: ["candidates", pollAddress],
    enabled: !!program && !!pollAddress,
    queryFn: async (): Promise<Candidate[]> => {
      if (!pollAddress) throw new Error("Poll address is required");
      const address = new PublicKey(pollAddress);

      const pollData = await program?.account.poll.fetch(address);
      if (!pollData) return [];

      const PID = new BN(pollData.id);

      const candidateAccounts = await program?.account.candidate.all();
      const candidates = candidateAccounts
        ?.filter((candidate) => candidate.account.pollId.eq(PID))
        .map((candidate) => ({
          cid: candidate.account.cid.toNumber(),
          pollId: candidate.account.pollId.toNumber(),
          publicKey: candidate.publicKey.toString(),
          name: candidate.account.name, // Candidate name
          hasRegistered: candidate.account.hasRegistered, // Whether they have registered
          votes: candidate.account.votes.toNumber(), // Votes (assuming it's a BN that needs conversion)
        }));

      return candidates ?? [];
    },
  });

  const hasUserVoted = useQuery({
    queryKey: ["has-voted", pollAddress],
    enabled: !!program && !!pollAddress,
    queryFn: async (): Promise<boolean> => {
      const voterAccount = await program?.account.voter.fetch(voterPDA);
      if (!voterAccount || !voterAccount.hasVoted) {
        return false; // Default value if no account exists or hasn't voted
      }

      return true;
    },
  });

  const registerCandidate = useMutation({
    mutationKey: ["candidates", pollAddress],
    //enabled: !!program && !!pollAddress,
    mutationFn: async ({ name, pollId }: { name: string; pollId: number }) => {
      if (!program || !anchorWallet?.publicKey || !count.data?.count) {
        console.log("program:", program);
        console.log("wallet:", anchorWallet?.publicKey?.toBase58());
        console.log("count data:", count.data);
        throw new Error("Poll program not ready");
      }

      const PID = new BN(pollId as number);
      const [pollPda] = PublicKey.findProgramAddressSync(
        [PID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [registerationsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("registerations")],
        program.programId
      );

      const regs = await program.account.registerations.fetch(
        registerationsPda
      );
      const CID = regs.count.add(new BN(1));

      const [candidatePda] = PublicKey.findProgramAddressSync(
        [PID.toArrayLike(Buffer, "le", 8), CID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      return await program.methods
        .registerCandidate(PID, name)
        .accountsPartial({
          user: anchorWallet.publicKey,
          poll: pollPda,
          registerations: registerationsPda,
          candidate: candidatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: async (sig: string) => {
      console.log("Candidate created with signature:", sig);
      await candidates.refetch();
    },

    onError: (error: Error) =>
      console.error("Poll Creation Error", error.message),
  });

  const vote = useMutation({
    mutationKey: ["candidates", pollAddress],
    //enabled: !!program && !!pollAddress,
    mutationFn: async ({
      candidateId,
      pollId,
    }: {
      candidateId: number;
      pollId: number;
    }) => {
      if (!program || !anchorWallet?.publicKey || !count.data?.count) {
        console.log("program:", program);
        console.log("wallet:", anchorWallet?.publicKey?.toBase58());
        console.log("count data:", count.data);
        throw new Error("Poll program not ready");
      }

      const PID = new BN(pollId);
      const CID = new BN(candidateId);

      const [pollPda] = PublicKey.findProgramAddressSync(
        [PID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [voterPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("voter"),
          PID.toArrayLike(Buffer, "le", 8),
          anchorWallet.publicKey.toBuffer(),
        ],
        program.programId
      );

      const [candidatePda] = PublicKey.findProgramAddressSync(
        [PID.toArrayLike(Buffer, "le", 8), CID.toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      return await program.methods
        .vote(PID, CID)
        .accountsPartial({
          user: anchorWallet.publicKey,
          poll: pollPda,
          candidate: candidatePda,
          voter: voterPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    },
    onSuccess: async (sig: string) => {
      console.log("Vote add with signature:", sig);
      await candidates.refetch();
    },

    onError: (error: Error) => console.error("Vote Error", error.message),
  });

  const serializedCandidates = (candidates: any[]): Candidate[] =>
    candidates.map((c: any) => ({
      ...c.account,
      publicKey: c.publicKey.toBase58(), // Convert to string
      cid: c.account.cid.toNumber(),
      pollId: c.account.pollId.toNumber(),
      votes: c.account.votes.toNumber(),
      name: c.account.name,
    }));

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

  return {
    count,
    createPoll,
    polls,
    createCounter,
    pollDetail,
    candidates,
    hasUserVoted,
    registerCandidate,
    vote,
    // fetchPoll,
    // voteOnPoll,
    // closePoll,
  };
};
