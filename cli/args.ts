/** Argument parsing for `bunx allsearch`. Pure — no I/O, no `process` access — so the whole
 * surface is unit-testable without spawning anything. */

export type CliOptions = {
  /** Port the user pinned with `--port`. Undefined means "pick a free one" (issue 20). */
  port?: number;
  /** Whether to open the default browser once the server answers. `--no-open` clears it. */
  open: boolean;
};

export type ParsedArgs =
  | { kind: 'run'; options: CliOptions }
  | { kind: 'help' }
  | { kind: 'version' }
  | { kind: 'error'; message: string };

export const USAGE = `Usage: allsearch [options]

Boots the AllSearch server on this machine and opens it in your browser.
Your data stays in a local SQLite database; nothing is sent to a server we run.

Options:
  -p, --port <number>  Use this exact port instead of picking a free one
      --no-open        Print the URL but do not open a browser
  -v, --version        Print the version and exit
  -h, --help           Print this help and exit`;

/** Parses `argv` (the arguments *after* the node binary and script path). Unknown flags are an
 * error rather than being ignored: a mistyped `--port` that silently booted on a random port
 * would look like the app losing the user's data, since the database is chosen per install and
 * the URL is the only thing they see. */
export function parseCliArgs(argv: string[]): ParsedArgs {
  const options: CliOptions = { open: true };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') return { kind: 'help' };
    if (arg === '--version' || arg === '-v') return { kind: 'version' };

    if (arg === '--no-open') {
      options.open = false;
      continue;
    }

    if (arg === '--open') {
      options.open = true;
      continue;
    }

    const portValue = readOptionValue(arg, argv, index, ['--port', '-p']);
    if (portValue) {
      if (portValue.value === undefined) {
        return { kind: 'error', message: `Missing a port number after "${arg}".` };
      }
      const port = parsePort(portValue.value);
      if (port === undefined) {
        return {
          kind: 'error',
          message: `"${portValue.value}" is not a valid port. Expected a whole number between 1 and 65535.`,
        };
      }
      options.port = port;
      index += portValue.consumed;
      continue;
    }

    return { kind: 'error', message: `Unknown option "${arg}".` };
  }

  return { kind: 'run', options };
}

/** Matches `--flag value` and `--flag=value` forms, returning how many extra argv entries the
 * match swallowed so the caller can skip them. */
function readOptionValue(
  arg: string,
  argv: string[],
  index: number,
  names: string[]
): { value: string | undefined; consumed: number } | undefined {
  for (const name of names) {
    if (arg === name) return { value: argv[index + 1], consumed: 1 };
    if (arg.startsWith(`${name}=`)) return { value: arg.slice(name.length + 1), consumed: 0 };
  }
  return undefined;
}

/** A port is only usable if it is a whole number in range. Parsed strictly rather than with
 * `parseInt`, which would read "3000abc" — and, worse, "0x1f" — as valid. */
function parsePort(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const port = Number(value);
  if (port < 1 || port > 65535) return undefined;
  return port;
}
