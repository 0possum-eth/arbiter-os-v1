# Installing Arbiter OS for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Git installed

## Installation Steps

### 1. Clone Arbiter OS

```bash
git clone https://github.com/0possum-eth/arbiter-os-v1.git ~/.config/opencode/superpowers
```

### 2. Register the Plugin

Create a symlink so OpenCode discovers the canonical plugin entrypoint:

```bash
mkdir -p ~/.config/opencode/plugins
rm -f ~/.config/opencode/plugins/arbiter-os.js
ln -s ~/.config/opencode/superpowers/.opencode/plugins/arbiter-os.js ~/.config/opencode/plugins/arbiter-os.js
```

### 3. Symlink Skills

Create a symlink so OpenCode's native skill tool discovers superpowers skills:

```bash
mkdir -p ~/.config/opencode/skills
rm -rf ~/.config/opencode/skills/superpowers
ln -s ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers
```

### 4. Restart OpenCode

Restart OpenCode. The plugin will automatically inject Arbiter OS run-loop context.

Verify by asking: "what is the canonical Arbiter OS entrypoint?" (expected: `run-epic`)

### Windows-native installer

From the repo root on Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/arbiter/install-opencode.ps1
```

## Usage

### Arbiter OS

After installation, use Arbiter OS as the orchestration layer:

- Start each cycle with `run-epic`
- Use trust gating commands (`approve-brick`, `mount-doc`, `list-bricks`) before execution when behavior docs are involved
- Build task context from indexed references via context packs

See full command examples in [docs/arbiter/USAGE.md](../docs/arbiter/USAGE.md).

### Finding Skills

Use OpenCode's native `skill` tool to list available skills:

```
use skill tool to list skills
```

### Loading a Skill

Use OpenCode's native `skill` tool to load a specific skill:

```
use skill tool to load superpowers/brainstorming
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.opencode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > Superpowers skills

## Updating

```bash
cd ~/.config/opencode/superpowers
git pull
```

## Troubleshooting

### Plugin not loading

1. Check plugin symlink: `ls -l ~/.config/opencode/plugins/arbiter-os.js`
2. Check source exists: `ls ~/.config/opencode/superpowers/.opencode/plugins/arbiter-os.js`
3. Check OpenCode logs for errors

### Skills not found

1. Check skills symlink: `ls -l ~/.config/opencode/skills/superpowers`
2. Verify it points to: `~/.config/opencode/superpowers/skills`
3. Use `skill` tool to list what's discovered

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `update_plan`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

- Report issues: https://github.com/0possum-eth/arbiter-os-v1/issues
- Full documentation: https://github.com/0possum-eth/arbiter-os-v1/blob/main/docs/README.opencode.md
