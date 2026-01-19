import { spawn, type SpawnOptions } from "node:child_process"

// Types

export interface BdIssue {
  id: string
  title: string
  description?: string
  status: "open" | "in_progress" | "blocked" | "deferred" | "closed"
  priority: number
  issue_type: string
  owner?: string
  created_at: string
  created_by?: string
  updated_at: string
  closed_at?: string
  parent?: string
  dependency_count?: number
  dependent_count?: number
  dependencies?: BdDependency[]
  dependents?: BdDependency[]
}

export interface BdDependency extends BdIssue {
  dependency_type: string
}

export interface BdListOptions {
  /** Maximum number of results (default: 50) */
  limit?: number
  /** Filter by status */
  status?: "open" | "in_progress" | "blocked" | "deferred" | "closed"
  /** Filter by priority (0-4) */
  priority?: number
  /** Filter by type */
  type?: string
  /** Filter by assignee */
  assignee?: string
  /** Filter by parent issue ID */
  parent?: string
  /** Show only ready issues (status=open, unblocked) */
  ready?: boolean
  /** Include closed issues */
  all?: boolean
}

export interface BdCreateOptions {
  title: string
  description?: string
  priority?: number
  type?: string
  assignee?: string
  parent?: string
  labels?: string[]
}

export interface BdUpdateOptions {
  title?: string
  description?: string
  priority?: number
  status?: "open" | "in_progress" | "blocked" | "deferred" | "closed"
  type?: string
  assignee?: string
  parent?: string
  addLabels?: string[]
  removeLabels?: string[]
}

export type SpawnFn = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ReturnType<typeof spawn>

export interface BdProxyOptions {
  /** Command to run (default: "bd") */
  command?: string
  /** Working directory for bd commands */
  cwd?: string
  /** Additional environment variables */
  env?: Record<string, string>
  /** Custom spawn function (for testing) */
  spawn?: SpawnFn
  /** Timeout in ms (default: 30000) */
  timeout?: number
}

export interface BdInfo {
  database_path: string
  issue_count: number
  mode: string
  daemon_connected: boolean
  daemon_status?: string
  daemon_version?: string
  socket_path?: string
  config?: Record<string, string>
}

// BdProxy

/**
 * Proxy class to spawn bd commands and parse JSON output.
 *
 * Provides typed methods for common bd operations: list, show, create, update.
 */
export class BdProxy {
  private options: {
    command: string
    cwd: string
    env: Record<string, string>
    spawn: SpawnFn
    timeout: number
  }

  constructor(options: BdProxyOptions = {}) {
    this.options = {
      command: options.command ?? "bd",
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? {},
      spawn: options.spawn ?? spawn,
      timeout: options.timeout ?? 30_000,
    }
  }

  /**
   * List issues with optional filters.
   */
  async list(options: BdListOptions = {}): Promise<BdIssue[]> {
    const args = ["list", "--json"]

    if (options.limit !== undefined) {
      args.push("--limit", String(options.limit))
    }
    if (options.status) {
      args.push("--status", options.status)
    }
    if (options.priority !== undefined) {
      args.push("--priority", String(options.priority))
    }
    if (options.type) {
      args.push("--type", options.type)
    }
    if (options.assignee) {
      args.push("--assignee", options.assignee)
    }
    if (options.parent) {
      args.push("--parent", options.parent)
    }
    if (options.ready) {
      args.push("--ready")
    }
    if (options.all) {
      args.push("--all")
    }

    const result = await this.exec(args)
    return JSON.parse(result) as BdIssue[]
  }

  /**
   * Show details for one or more issues.
   */
  async show(ids: string | string[]): Promise<BdIssue[]> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const args = ["show", "--json", ...idList]

    const result = await this.exec(args)
    return JSON.parse(result) as BdIssue[]
  }

  /**
   * Create a new issue.
   *
   * @returns The created issue
   */
  async create(options: BdCreateOptions): Promise<BdIssue> {
    const args = ["create", "--json", options.title]

    if (options.description) {
      args.push("--description", options.description)
    }
    if (options.priority !== undefined) {
      args.push("--priority", String(options.priority))
    }
    if (options.type) {
      args.push("--type", options.type)
    }
    if (options.assignee) {
      args.push("--assignee", options.assignee)
    }
    if (options.parent) {
      args.push("--parent", options.parent)
    }
    if (options.labels && options.labels.length > 0) {
      args.push("--labels", options.labels.join(","))
    }

    const result = await this.exec(args)
    const issues = JSON.parse(result) as BdIssue[]
    return issues[0]
  }

  /**
   * Update one or more issues.
   *
   * @param ids - Issue ID(s) to update
   * @param options - Fields to update
   * @returns The updated issues
   */
  async update(ids: string | string[], options: BdUpdateOptions): Promise<BdIssue[]> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const args = ["update", "--json", ...idList]

    if (options.title) {
      args.push("--title", options.title)
    }
    if (options.description) {
      args.push("--description", options.description)
    }
    if (options.priority !== undefined) {
      args.push("--priority", String(options.priority))
    }
    if (options.status) {
      args.push("--status", options.status)
    }
    if (options.type) {
      args.push("--type", options.type)
    }
    if (options.assignee) {
      args.push("--assignee", options.assignee)
    }
    if (options.parent !== undefined) {
      args.push("--parent", options.parent)
    }
    if (options.addLabels && options.addLabels.length > 0) {
      for (const label of options.addLabels) {
        args.push("--add-label", label)
      }
    }
    if (options.removeLabels && options.removeLabels.length > 0) {
      for (const label of options.removeLabels) {
        args.push("--remove-label", label)
      }
    }

    const result = await this.exec(args)
    return JSON.parse(result) as BdIssue[]
  }

  /**
   * Close one or more issues.
   *
   * @param ids - Issue ID(s) to close
   * @returns The closed issues
   */
  async close(ids: string | string[]): Promise<BdIssue[]> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const args = ["close", "--json", ...idList]

    const result = await this.exec(args)
    return JSON.parse(result) as BdIssue[]
  }

  /**
   * Add a comment to an issue.
   *
   * @param id - Issue ID to add comment to
   * @param comment - The comment text
   */
  async addComment(id: string, comment: string): Promise<void> {
    const args = ["comments", "add", id, comment]
    await this.exec(args)
  }

  /**
   * Get database info.
   *
   * @returns Database and daemon information
   */
  async getInfo(): Promise<BdInfo> {
    const args = ["info", "--json"]
    const result = await this.exec(args)
    return JSON.parse(result) as BdInfo
  }

  /**
   * Execute a bd command and return stdout.
   */
  private exec(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = this.options.spawn(this.options.command, args, {
        cwd: this.options.cwd,
        env: { ...process.env, ...this.options.env },
        stdio: ["ignore", "pipe", "pipe"],
      })

      let stdout = ""
      let stderr = ""

      const timeoutId = setTimeout(() => {
        proc.kill("SIGKILL")
        reject(new Error(`bd command timed out after ${this.options.timeout}ms`))
      }, this.options.timeout)

      proc.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString()
      })

      proc.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString()
      })

      proc.on("error", err => {
        clearTimeout(timeoutId)
        reject(err)
      })

      proc.on("close", code => {
        clearTimeout(timeoutId)
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`bd exited with code ${code}: ${stderr.trim() || stdout.trim()}`))
        }
      })
    })
  }
}
