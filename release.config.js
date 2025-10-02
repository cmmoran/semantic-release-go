const semver = require('semver');
const { execSync } = require('child_process');
const fs = require('fs');

const VERSION_FILE = process.env.VERSION_FILE || null;
const CHANGELOG_FILE = process.env.CHANGELOG_FILE || 'CHANGELOG.md';

module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'feat', release: 'minor' },
          { type: 'break', release: 'major' },
          { breaking: true, release: 'major' },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
        analyzeCommits: (pluginConfig, context) => {
          const { commits, lastRelease } = context;
          const lastVersion = lastRelease?.version || '0.0.0';
          let highestRelease = null;

          commits.forEach(commit => {
            const hasBreaking =
              commit.type === 'break' ||
              (commit.notes || []).some(n => /BREAKING CHANGE/i.test(n.text));

            if (commit.type === 'fix' || commit.type === 'perf') {
              highestRelease = highestRelease || 'patch';
            }

            if (commit.type === 'feat') {
              highestRelease =
                highestRelease === 'patch' ? 'minor' : (highestRelease || 'minor');
            }

            if (hasBreaking) {
              if (semver.lt(lastVersion, '1.0.0')) {
                highestRelease = 'minor';
              } else {
                highestRelease = 'major';
              }
            }
          });

          return highestRelease;
        },
      },
    ],
    {
      prepare: async (pluginConfig, context) => {
        const nextVersion = context.nextRelease.version;
        const currentVersion = context.lastRelease?.version || '0.0.0';

        if (
          semver.gte(currentVersion, '1.0.0') &&
          semver.diff(currentVersion, nextVersion) === 'major'
        ) {
          const major = semver.major(nextVersion);
          const repoUrl = context.options.repositoryUrl
            .replace(/^https?:\/\/(github.com\/)?/, 'github.com/')
            .replace(/^git@github.com:/, 'github.com/')
            .replace(/\.git$/, '');

          console.log(`>>> Detected major bump, updating module path to /v${major}`);

          execSync(`go mod edit -module ${repoUrl}/v${major}`, { stdio: 'inherit' });
          execSync(`goimports -w .`, { stdio: 'inherit' });
          execSync('go mod tidy', { stdio: 'inherit' });

          execSync('git add go.mod go.sum $(find . -name "*.go")', { stdio: 'inherit' });
          execSync(`git commit -m "chore(go.mod): update module path for v${major}"`, { stdio: 'inherit' });
        }

        // Optional VERSION file
        if (VERSION_FILE) {
          console.log(`>>> Writing version ${context.nextRelease.version} to ${VERSION_FILE}`);
          fs.writeFileSync(VERSION_FILE, context.nextRelease.version + '\n');
          execSync(`git add ${VERSION_FILE}`, { stdio: 'inherit' });
        }
      },
    },
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features' },
            { type: 'fix', section: 'Bug Fixes' },
            { type: 'perf', section: 'Performance' },
            { type: 'refactor', section: 'Refactoring' },
            { type: 'docs', section: 'Documentation' },
            { type: 'test', section: 'Tests' },
            { type: 'build', section: 'Build & Dependencies' },
            { type: 'chore', section: 'Chores' },
            { type: 'break', section: 'Breaking Changes' },
          ],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: CHANGELOG_FILE,
        changelogTitle: '# Changelog',
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: [CHANGELOG_FILE, 'go.mod', 'go.sum'].concat(VERSION_FILE ? [VERSION_FILE] : []),
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
