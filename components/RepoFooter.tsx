export const REPO_URL = "https://github.com/Niranjan-M-T/open-sign";

/** Small "open source — view the code" link shown on auth + admin chrome. */
export default function RepoFooter({ dark = true }: { dark?: boolean }) {
  return (
    <p
      className={`mt-8 text-center text-xs ${
        dark ? "text-white/40" : "text-ink/40"
      }`}
    >
      Open source ·{" "}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline hover:text-accent"
      >
        view the code on GitHub
      </a>
    </p>
  );
}
