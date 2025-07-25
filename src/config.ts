import * as core from '@actions/core'
import * as github from '@actions/github'
import type { ActionConfig } from './types'

export class ConfigManager {
  private config: Partial<ActionConfig> = {}

  async load(): Promise<void> {
    try {
      // GitHub Actions の入力パラメータを読み込む
      this.config.token = core.getInput('token', { required: true })
      this.config.syncFolder = core.getInput('sync-folder') || 'docs'
      this.config.conflictStrategy = (core.getInput('conflict-strategy') ||
        'repo-wins') as ActionConfig['conflictStrategy']

      // GitHub コンテキストから情報を取得
      const context = github.context
      this.config.repository = `${context.repo.owner}/${context.repo.repo}`
      this.config.owner = context.repo.owner
      this.config.repo = context.repo.repo

      // Wiki リポジトリの URL を構築
      this.config.wikiRepo = `https://${this.config.token}@github.com/${this.config.repository}.wiki.git`

      // 削除同期の設定
      const syncDeletes = core.getInput('sync-deletes')
      this.config.syncDeletes = syncDeletes === '' ? true : syncDeletes === 'true'

      // 設定の検証
      await this.validate()
    } catch (error) {
      throw new Error(
        `Configuration loading failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  private async validate(): Promise<void> {
    // 必須パラメータの検証
    if (!this.config.token) {
      throw new Error('GitHub token is required')
    }

    if (!this.config.repository) {
      throw new Error('Repository information is missing')
    }

    // 競合戦略の検証
    const validStrategies: ActionConfig['conflictStrategy'][] = [
      'repo-wins',
      'wiki-wins',
      'manual',
      'skip',
    ]
    if (!this.config.conflictStrategy || !validStrategies.includes(this.config.conflictStrategy)) {
      throw new Error(
        `Invalid conflict strategy: ${this.config.conflictStrategy}. Valid options: ${validStrategies.join(', ')}`,
      )
    }

    // 同期フォルダパスの検証
    if (this.config.syncFolder?.startsWith('/')) {
      throw new Error('Sync folder path should be relative, not absolute')
    }

    core.info('Configuration validated successfully')
  }

  get token(): string {
    if (!this.config.token) throw new Error('Token not loaded')
    return this.config.token
  }

  get repository(): string {
    if (!this.config.repository) throw new Error('Repository not loaded')
    return this.config.repository
  }

  get owner(): string {
    if (!this.config.owner) throw new Error('Owner not loaded')
    return this.config.owner
  }

  get repo(): string {
    if (!this.config.repo) throw new Error('Repo not loaded')
    return this.config.repo
  }

  get syncFolder(): string {
    if (!this.config.syncFolder) throw new Error('Sync folder not loaded')
    return this.config.syncFolder
  }

  get wikiRepo(): string {
    if (!this.config.wikiRepo) throw new Error('Wiki repo not loaded')
    return this.config.wikiRepo
  }

  get conflictStrategy(): ActionConfig['conflictStrategy'] {
    if (!this.config.conflictStrategy) throw new Error('Conflict strategy not loaded')
    return this.config.conflictStrategy
  }

  get syncDeletes(): boolean {
    return this.config.syncDeletes ?? true
  }

  getConfig(): ActionConfig {
    if (
      !this.config.token ||
      !this.config.repository ||
      !this.config.owner ||
      !this.config.repo ||
      !this.config.syncFolder ||
      !this.config.wikiRepo ||
      !this.config.conflictStrategy
    ) {
      throw new Error('Configuration not fully loaded')
    }

    return this.config as ActionConfig
  }
}
