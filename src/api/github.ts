import { githubConfig } from "@/config";

const GITHUB_API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";

/** 从 GitHub raw 读取数据文件（无需 Token，公开仓库可用） */
export async function fetchPublicData<T>(): Promise<T | null> {
	const url = `${RAW}/${githubConfig.owner}/${githubConfig.repo}/${githubConfig.branch}/${githubConfig.dataPath}`;
	const res = await fetch(url, { cache: "no-cache" });
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`读取失败: ${res.status}`);
	return res.json();
}

/** 从 GitHub API 读取数据文件（需要 Token，支持私有仓库） */
export async function fetchData<T>(): Promise<{
	content: T;
	sha: string;
} | null> {
	const token = getToken();
	const url = `${GITHUB_API}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.dataPath}`;
	const res = await fetch(url, {
		headers: {
			Accept: "application/vnd.github.v3+json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`读取失败: ${res.status}`);
	const data = await res.json();
	return { content: JSON.parse(decodeBase64(data.content)), sha: data.sha };
}

/** 保存数据到 GitHub */
export async function saveData(
	newData: unknown,
	sha: string | null,
): Promise<string> {
	const token = getToken();
	if (!token) throw new Error("未登录，请先输入 GitHub Token");
	const url = `${GITHUB_API}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${githubConfig.dataPath}`;
	const body = {
		message: "更新博客数据",
		content: encodeBase64(JSON.stringify(newData, null, 2)),
		branch: githubConfig.branch,
		...(sha ? { sha } : {}),
	};
	const res = await fetch(url, {
		method: "PUT",
		headers: {
			Accept: "application/vnd.github.v3+json",
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`保存失败: ${res.status} ${await res.text()}`);
	const result = await res.json();
	return result.content.sha;
}

/** 验证 Token 是否有效，返回 GitHub 用户名 */
export async function verifyToken(token: string): Promise<string | null> {
	const res = await fetch(`${GITHUB_API}/user`, {
		headers: {
			Accept: "application/vnd.github.v3+json",
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) return null;
	const user = await res.json();
	return user.login;
}

function getToken(): string | null {
	return localStorage.getItem("github_token");
}

export function saveToken(token: string) {
	localStorage.setItem("github_token", token);
}

export function clearToken() {
	localStorage.removeItem("github_token");
}

export function hasToken(): boolean {
	return !!localStorage.getItem("github_token");
}

function decodeBase64(str: string): string {
	return decodeURIComponent(escape(atob(str)));
}

function encodeBase64(str: string): string {
	return btoa(unescape(encodeURIComponent(str)));
}
