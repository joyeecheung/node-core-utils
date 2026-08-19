import { ListrEnquirerPromptAdapter } from '@listr2/prompt-adapter-enquirer';

import { shortSha } from '../utils.js';
import { forceRunAsync } from '../run.js';

export function doUpstream() {
  return {
    title: 'Port commits to V8 checkout',
    task: (ctx, task) => {
      return task.newListr([
        generatePatches(),
        applyPatches()
      ]);
    }
  };
}

function generatePatches() {
  return {
    title: 'Generate patches from Node.js repository',
    task: async(ctx) => {
      const shas = ctx.sha;
      const fullShas = await Promise.all(
        shas.map(async(sha) => {
          const stdout = await forceRunAsync('git', ['rev-parse', sha], {
            ignoreFailure: false,
            captureStdout: true,
            spawnArgs: { cwd: ctx.nodeDir }
          });
          return stdout.trim();
        })
      );
      ctx.patches = await Promise.all(fullShas.map(async(sha) => {
        const patch = await forceRunAsync(
          'git',
          ['format-patch', '--stdout', `${sha}^..${sha}`, '--', 'deps/v8'],
          {
            ignoreFailure: false,
            captureStdout: true,
            spawnArgs: { cwd: ctx.nodeDir }
          }
        );
        if (!patch || !patch.trim()) {
          throw new Error(
            `Commit ${shortSha(sha)} does not modify deps/v8, nothing to port`
          );
        }
        return { sha, data: patch };
      }));
    }
  };
}

function applyPatches() {
  return {
    title: 'Apply patches to V8 checkout',
    task: (ctx, task) => {
      return task.newListr(ctx.patches.map(applyPatchTask));
    }
  };
}

function applyPatchTask(patch) {
  return {
    title: `Apply ${shortSha(patch.sha)}`,
    task: async(ctx, task) => {
      await applyPatch(ctx, task, patch);
    }
  };
}

async function applyPatch(ctx, task, patch) {
  try {
    await forceRunAsync('git', ['am', '-p3', '--3way'], {
      ignoreFailure: false,
      input: patch.data,
      spawnArgs: { cwd: ctx.v8Dir }
    });
  } catch (e) {
    patch.hadConflicts = true;
    await task.prompt(ListrEnquirerPromptAdapter).run({
      type: 'input',
      message: "Resolve merge conflicts in the V8 checkout and enter 'RESOLVED'",
      validate: value => value.toUpperCase() === 'RESOLVED'
    });
    await forceRunAsync('git', ['am', '--continue'], {
      ignoreFailure: false,
      spawnArgs: { cwd: ctx.v8Dir }
    });
  }
}
