# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries begin with the unreleased `1.3.0`. The project's earlier releases
(`1.0.0` → `1.2.0`) predate this file; their history lives in the git log and
on [npm](https://www.npmjs.com/package/waitfeed?activeTab=versions).

## [Unreleased]

### Added

- **Claude Code host** — the news card rides the host's `AbovePrompt` band
  (`claude-mod`), shown only while Claude works and gone on turn end, Esc, or
  a wait-on-the-user, plus a `/feed` reader pane. The `claude/` adapter runs
  the shared data cycle.
- **Landing page and docs** — a Next.js 16 site with an animated hero, feature
  grid, FAQ, and a full `/docs` manual covering every host, the shared config
  file, and the pipeline.

### Changed

- Unified `newsMode` behavior across all three hosts, and expanded the test
  suites (unit + built-bundle E2E).

### Fixed

- Claude mod contract tests, and Tailwind `cssConflict` warnings on the site.

[Unreleased]: https://github.com/faizjamadar18/waitfeed/commits/main
