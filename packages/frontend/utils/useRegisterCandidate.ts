import { BN } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Backend } from "../../backend/target/types/backend";

const programId = new PublicKey(
  require("../../backend/target/idl/backend.json").address
);

export const useRegisterCandidate = async (
  program: Program<Backend>,
  publicKey: PublicKey,
  pollId: number,
  name: string
): Promise<string> => {
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

  return await program.methods
    .registerCandidate(PID, name)
    .accountsPartial({
      user: publicKey,
      poll: pollPda,
      registerations: registerationsPda,
      candidate: candidatePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
};
