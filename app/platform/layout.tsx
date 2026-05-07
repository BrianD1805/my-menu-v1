import OwnerPlatformAccessGate from "@/components/admin/OwnerPlatformAccessGate";
import { ReactNode } from "react";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <OwnerPlatformAccessGate>{children}</OwnerPlatformAccessGate>;
}
