/** Windows resolves pnpm.cmd through cmd.exe; POSIX runtimes can spawn pnpm directly. */
export function pnpmInvocation(args, platform = process.platform, commandShell = process.env.ComSpec) {
  if (platform === "win32") {
    const escapeCommandArgument = (value) => {
      const escaped = String(value)
        .replace(/[%]/g, "%%")
        .replace(/[&|<>^()]/g, "^$&");
      return /\s/.test(escaped) ? `"${escaped.replace(/"/g, '^"')}"` : escaped;
    };
    return {
      command: commandShell || "cmd.exe",
      args: ["/d", "/s", "/c", `pnpm ${args.map(escapeCommandArgument).join(" ")}`]
    };
  }
  return { command: "pnpm", args };
}
