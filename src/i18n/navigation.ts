import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Create typed navigation helpers
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
