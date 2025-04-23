"use client";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import idl from "../../backend/target/idl/backend.json";
import { Backend } from "../../backend/target/types/backend";
import { Candidate, Poll } from "@/utils/interfaces";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Base64 } from "js-base64";
import { useAnchorWallet } from "./useAnchorWallet";

//const anchorWallet = useAnchorWallet();

const programId = new PublicKey(idl.address);
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

export const getProvider = (
  publicKey: PublicKey | null,
  signTransaction: any,
  sendTransaction: any
): Program<Backend> | null => {
  if (!publicKey || !signTransaction) {
    console.error("Wallet not connected or missing signTransaction.");
    return null;
  }

  const connection = new Connection(RPC_URL);
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction, sendTransaction } as unknown as Wallet,
    { commitment: "processed" }
  );

  // Create program with IDL directly
  return new Program<Backend>(idl as any, provider);
};

export const getReadonlyProvider = (): Program<Backend> => {
  console.log("Creating read-only provider with RPC_URL:", RPC_URL);
  const connection = new Connection(RPC_URL, "confirmed");
  console.log("Connection created:", connection);

  // Use a dummy wallet for read-only operations
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
    signAllTransactions: async () => {
      throw new Error("Read-only provider cannot sign transactions.");
    },
  };

  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: "processed",
  });
  console.log("Provider created:", provider);

  // Create program with IDL directly
  const program = new Program<Backend>(idl as any, provider);
  console.log("Program created:", program);
  return program;
};

export const getCounter = async (program: Program<Backend>): Promise<BN> => {
  try {
    // console.log("ds", program.programId);
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      program.programId
    );

    //console.log("sdd", counterPDA);

    const counter = await program.account.counter.fetch(counterPDA);

    //console.log(program.programId, counter);

    if (!counter) {
      console.warn("No counter found, returning zero");
      return new BN(0);
    }

    return counter.count;
  } catch (error) {
    console.error("Failed to retrieve counter:", error);
    return new BN(-1);
  }
};

export const getProviderWithKeypair = (
  publicKey: PublicKey | null,
  signTransaction: any,
  sendTransaction: any
): Program<Backend> | null => {
  if (!publicKey || !signTransaction) {
    console.error("Wallet not connected or missing signTransaction.");
    return null;
  }

  const connection = new Connection(RPC_URL);
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: keypair.publicKey,
      signTransaction,
      sendTransaction,
    } as unknown as Wallet,
    { commitment: "processed" }
  );

  return new Program<Backend>(idl as any, provider);
};
const keypair = Keypair.generate();

export const initialize = async (
  program: Program<Backend>
): Promise<string> => {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  return await transact(async (wallet) => {
    // Authorize and get user's public key
    const authResult = await wallet.authorize({
      chain: "solana:devnet",
      identity: {
        name: "Your App Name",
        uri: "https://yourapp.com",
        icon: "/icon.png",
      },
    });

    // Decode the base64 string into a byte array
    const decodedBytes = Base64.toUint8Array(authResult.accounts[0].address);

    //console.log("Pub ID", decodedBytes);

    const userPublicKey = new PublicKey(decodedBytes);

    console.log("Pub Key", userPublicKey, programId);

    // Find PDAs
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      programId
    );
    const [registerationsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("registerations")],
      programId
    );

    console.log("Found Program Address for Counter and Registerations");

    // Build transaction
    console.log("Calling initialize method...");
    const tx = await program.methods
      .initialize()
      .accountsPartial({
        user: userPublicKey,
        counter: counterPDA,
        registerations: registerationsPDA,
        systemProgram: SystemProgram.programId,
      })
      .transaction();
    console.log("Transaction built:", tx.instructions);

    // Fetch blockhash
    // const { blockhash } = await connection.getLatestBlockhash("confirmed");
    // console.log("Blockhash fetched:", blockhash);
    const block = await connection.getLatestBlockhashAndContext("confirmed");

    console.log(block);

    // const blockhash = await connection
    //   .getLatestBlockhash("confirmed")
    //   .then((result) => {
    //     return result.blockhash;
    //   });

    // console.log("Blockhash fetched:", blockhash);

    tx.recentBlockhash = "Hvak77GGNTqvmwgTFSRUc8p8EBeaNqwRfGt3Hn6Xu2cJ";
    tx.feePayer = userPublicKey;

    // Convert to versioned transaction
    const msg = tx.compileMessage();
    console.log("Message", msg);
    const vtx = new VersionedTransaction(msg);
    console.log("VTX", vtx);

    // Sign and send transaction using wallet
    const result = await wallet.signAndSendTransactions({
      transactions: [vtx],
    });

    console.log(result[0]);

    const signature = result[0];
    await connection.confirmTransaction(signature, "confirmed");

    console.log("Sign", signature);

    return signature;
  });
};

export const initializeChain = async (
  program: Program<Backend>
): Promise<string> => {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  return await transact(async (wallet) => {
    // Authorize and get user's public key
    const authResult = await wallet.authorize({
      chain: "solana:devnet",
      identity: {
        name: "Your App Name",
        uri: "https://yourapp.com",
        icon: "/icon.png",
      },
    });

    // Decode the base64 string into a byte array
    const decodedBytes = Base64.toUint8Array(authResult.accounts[0].address);

    //console.log("Pub ID", decodedBytes);

    const userPublicKey = new PublicKey(decodedBytes);

    console.log("Pub Key", userPublicKey, programId);

    // Find PDAs
    const [counterPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      programId
    );
    const [registerationsPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("registerations")],
      programId
    );

    return "";
  });
};

// export const initialize = async (
//   program: Program<Backend>,
//   publicKey: PublicKey
// ): Promise<TransactionSignature> => {
//   const [counterPDA] = PublicKey.findProgramAddressSync(
//     [Buffer.from("counter")],
//     programId
//   );
//   const [registerationsPDA] = PublicKey.findProgramAddressSync(
//     [Buffer.from("registerations")],
//     programId
//   );

//   const tx = await program.methods
//     .initialize()
//     .accountsPartial({
//       user: publicKey,
//       counter: counterPDA,
//       registerations: registerationsPDA,
//       systemProgram: SystemProgram.programId,
//     })
//     .transaction();

//   const connection = new Connection(
//     program.provider.connection.rpcEndpoint,
//     "confirmed"
//   );
//   const { blockhash } = await connection.getRecentBlockhash();

//   tx.recentBlockhash = blockhash;
//   tx.feePayer = publicKey;

//   const signedTx = await program.provider.wallet?.signTransaction(tx);
//   if (!signedTx) throw new Error("Failed to sign transaction");

//   const signature = await connection.sendRawTransaction(signedTx.serialize());
//   await connection.confirmTransaction(signature);

//   return signature;
// };

export const createPoll = async (
  program: Program<Backend>,
  publicKey: PublicKey,
  nextCount: BN,
  description: string,
  start: number,
  end: number
): Promise<TransactionSignature> => {
  //console.log("PID", programId, program.programId);
  const [counterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    programId
  );
  const [pollPDA] = PublicKey.findProgramAddressSync(
    [nextCount.toArrayLike(Buffer, "le", 8)],
    programId
  );

  const startBN = new BN(start);
  const endBN = new BN(end);

  const tx = await program.methods
    .createPoll(description, startBN, endBN)
    .accountsPartial({
      user: publicKey,
      counter: counterPDA,
      poll: pollPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // const connection = new Connection(
  //   program.provider.connection.rpcEndpoint,
  //   "confirmed"
  // );
  // await connection.confirmTransaction(tx, "finalized");

  return tx;
};

export const registerCandidate = async (
  program: Program<Backend>,
  publicKey: PublicKey,
  pollId: number,
  name: string
): Promise<TransactionSignature> => {
  const PID = new BN(pollId);
  const [pollPda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, "le", 8)],
    programId
  );
  const [registerationsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registerations")],
    programId
  );

  const regs = await program.account.registerations.fetch(registerationsPda);
  const CID = regs.count.add(new BN(1));

  const [candidatePda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, "le", 8), CID.toArrayLike(Buffer, "le", 8)],
    programId
  );

  const tx = await program.methods
    .registerCandidate(PID, name)
    .accountsPartial({
      user: publicKey,
      poll: pollPda,
      registerations: registerationsPda,
      candidate: candidatePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    "confirmed"
  );
  await connection.confirmTransaction(tx, "finalized");

  return tx;
};

export const vote = async (
  program: Program<Backend>,
  publicKey: PublicKey,
  pollId: number,
  candidateId: number
): Promise<TransactionSignature> => {
  const PID = new BN(pollId);
  const CID = new BN(candidateId);

  const [pollPda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, "le", 8)],
    programId
  );
  const [voterPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter"),
      PID.toArrayLike(Buffer, "le", 8),
      publicKey.toBuffer(),
    ],
    programId
  );
  const [candidatePda] = PublicKey.findProgramAddressSync(
    [PID.toArrayLike(Buffer, "le", 8), CID.toArrayLike(Buffer, "le", 8)],
    programId
  );

  const tx = await program.methods
    .vote(PID, CID)
    .accountsPartial({
      user: publicKey,
      poll: pollPda,
      candidate: candidatePda,
      voter: voterPDA,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const connection = new Connection(
    program.provider.connection.rpcEndpoint,
    "confirmed"
  );
  await connection.confirmTransaction(tx, "finalized");

  return tx;
};

export const fetchAllPolls = async (
  program: Program<Backend>
): Promise<Poll[]> => {
  try {
    console.log("[fetchAllPolls] Starting to fetch polls");
    console.log("[fetchAllPolls] Program ID:", program.programId.toBase58());
    console.log("[fetchAllPolls] Program account:", program.account);

    const polls = await program.account.poll.all();
    console.log("[fetchAllPolls] Raw polls data:", polls);

    const serializedPolls = serializedPoll(polls);
    console.log("[fetchAllPolls] Serialized polls:", serializedPolls);

    return serializedPolls;
  } catch (error) {
    console.error("[fetchAllPolls] Error fetching polls:", error);
    throw error;
  }
};

export const fetchPollDetails = async (
  program: Program<Backend>,
  pollAddress: string
): Promise<Poll> => {
  const poll = await program.account.poll.fetch(pollAddress);

  const serialized: Poll = {
    ...poll,
    publicKey: pollAddress,
    id: poll.id.toNumber(),
    start: poll.start.toNumber() * 1000,
    end: poll.end.toNumber() * 1000,
    candidates: poll.candidates.toNumber(),
  };

  return serialized;
};

const serializedPoll = (polls: any[]): Poll[] =>
  polls.map((c: any) => ({
    ...c.account,
    publicKey: c.publicKey.toBase58(),
    id: c.account.id.toNumber(),
    start: c.account.start.toNumber() * 1000,
    end: c.account.end.toNumber() * 1000,
    candidates: c.account.candidates.toNumber(),
  }));

//   Program Id: Ar2FG8HLgS71AgzTs7nHWB5wQPi6sTh3EHJyfRsbHp2y

// Signature: 462yARugZM3FQE4LNzpVCBxSAAaVc8TZCNVPAoxE7BPCzjqqc9A1Jc26Gg3ckrcLMk9Uf6SG8S23StsYhWRrcBuB

export const fetchAllCandidates = async (
  program: Program<Backend>,
  pollAddress: string
): Promise<Candidate[]> => {
  const pollData = await fetchPollDetails(program, pollAddress);
  if (!pollData) return [];

  const PID = new BN(pollData.id);

  const candidateAccounts = await program.account.candidate.all();
  const candidates = candidateAccounts.filter((candidate) => {
    return candidate.account.pollId.eq(PID);
  });

  return candidates as unknown as Candidate[];
};

export const hasUserVoted = async (
  program: Program<Backend>,
  publicKey: PublicKey,
  pollId: number
): Promise<boolean> => {
  const PID = new BN(pollId);

  const [voterPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("voter"),
      PID.toArrayLike(Buffer, "le", 8),
      publicKey.toBuffer(),
    ],
    programId
  );

  try {
    const voterAccount = await program.account.voter.fetch(voterPda);
    if (!voterAccount || !voterAccount.hasVoted) {
      return false; // Default value if no account exists or hasn't voted
    }

    return true;
  } catch (error) {
    console.error("Error fetching voter account:", error);
    return false;
  }
};
