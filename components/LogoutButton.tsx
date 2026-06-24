"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="text-sm font-semibold text-white/50 hover:text-white"
    >
      Log out
    </button>
  );
}
