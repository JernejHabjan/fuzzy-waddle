type MultiplayerLogLevel = "INFO" | "WARNING" | "ERROR" | "DEBUG";

/**
 * Route multiplayer diagnostics through console.log so browser devtools keep the
 * output to a single line instead of expanding warn/error stack traces.
 */
export function createMultiplayerClientLogger(scope: string) {
  const write = (level: MultiplayerLogLevel, message: string, ...context: unknown[]): void => {
    const line = `${level} [${scope}] ${message}`;
    if (context.length > 0) {
      console.log(line, ...context);
      return;
    }
    console.log(line);
  };

  return {
    debug: (message: string, ...context: unknown[]) => write("DEBUG", message, ...context),
    info: (message: string, ...context: unknown[]) => write("INFO", message, ...context),
    warn: (message: string, ...context: unknown[]) => write("WARNING", message, ...context),
    error: (message: string, ...context: unknown[]) => write("ERROR", message, ...context)
  };
}
