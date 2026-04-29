import { AbnAmroAdapter } from "@/providers/adapters/abn-amro";
import { BitvavoAdapter } from "@/providers/adapters/bitvavo";
import { DegiroAdapter } from "@/providers/adapters/degiro";
import { RevolutBusinessAdapter } from "@/providers/adapters/revolut";

export const providerAdapters = {
  ABN_AMRO: new AbnAmroAdapter(),
  BITVAVO: new BitvavoAdapter(),
  REVOLUT: new RevolutBusinessAdapter(),
  DEGIRO: new DegiroAdapter(),
};
