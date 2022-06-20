import {
  EngagementEvents,
  extractNoteChangeEntryCounts,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { AnalyticsUtils } from "../utils/analytics";
import { BasicCommand } from "./base";
import {
  MoveNoteCommand,
  CommandOpts as MoveNoteCommandOpts,
  CommandOutput as MoveNoteCommandOutput,
} from "./MoveNoteCommand";

type CommandOpts = MoveNoteCommandOpts;
type CommandInput = any;
type CommandOutput = MoveNoteCommandOutput;

/**
 * This is `Dendron: Rename Note`.
 * Currently (as of 2022-06-15),
 * this is simply wrapping methods of the move note command and calling them with a custom option.
 * This is done to correctly register the command and to properly instrument command usage.
 *
 * TODO: refactor move and rename logic, redesign arch for both commands.
 */
export class RenameNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.RENAME_NOTE.key;
  private _moveNoteCommand = new MoveNoteCommand();

  async sanityCheck() {
    return this._moveNoteCommand.sanityCheck();
  }

  private populateCommandOpts(opts: CommandOpts): MoveNoteCommandOpts {
    return {
      allowMultiselect: false,
      useSameVault: true,
      title: "Rename Note",
      ...opts,
    };
  }

  async gatherInputs(opts: CommandOpts): Promise<CommandInput | undefined> {
    return this._moveNoteCommand.gatherInputs(this.populateCommandOpts(opts));
  }

  trackProxyMetrics({
    noteChangeEntryCounts,
  }: {
    noteChangeEntryCounts: {
      createdCount: number;
      deletedCount: number;
      updatedCount: number;
    };
  }) {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
    const { vaults } = engine;

    AnalyticsUtils.track(EngagementEvents.RefactoringCommandUsed, {
      command: this.key,
      numVaults: vaults.length,
      ...noteChangeEntryCounts,
      ..._.omit(this._moveNoteCommand._proxyMetricPayload, [
        "maxNumChildren",
        "maxNumLinks",
        "maxNumChars",
        "maxNoteDepth",
      ]),
    });
  }

  addAnalyticsPayload(_opts: CommandOpts, out: CommandOutput) {
    const noteChangeEntryCounts =
      out !== undefined
        ? { ...extractNoteChangeEntryCounts(out.changed) }
        : {
            createdCount: 0,
            updatedCount: 0,
            deletedCount: 0,
          };
    try {
      this.trackProxyMetrics({ noteChangeEntryCounts });
    } catch (error) {
      this.L.error({ error });
    }
    return noteChangeEntryCounts;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    return this._moveNoteCommand.execute(this.populateCommandOpts(opts));
  }
}
