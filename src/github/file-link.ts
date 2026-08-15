interface GitHubFileLinkOptions {
  serverUrl: string;
  owner: string;
  repo: string;
  sha: string;
  filename: string;
  line: number;
}

export function buildGitHubFileLineUrl({
  serverUrl,
  owner,
  repo,
  sha,
  filename,
  line,
}: GitHubFileLinkOptions): string {
  const encodedPath = filename
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return (
    `${serverUrl}/${owner}/${repo}/blob/` +
    `${sha}/${encodedPath}` +
    `?plain=1#L${line}`
  );
}
