interface GitHubFileLinkOptions {
    serverUrl: string;
    owner: string;
    repo: string;
    sha: string;
    filename: string;
    line: number;
}
export declare function buildGitHubFileLineUrl({ serverUrl, owner, repo, sha, filename, line, }: GitHubFileLinkOptions): string;
export {};
//# sourceMappingURL=file-link.d.ts.map