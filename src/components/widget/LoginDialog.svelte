<script lang="ts">
import {
	clearToken,
	fetchData,
	fetchPublicData,
	hasToken,
	saveData,
	saveToken,
	verifyToken,
} from "../../api/github";
import {
	setAboutText,
	setCardRadius,
	setFontSize,
	setHue,
	setLayoutDensity,
	setProfile,
	setSkills,
} from "@utils/setting-utils";
import { onMount } from "svelte";

export let show = false;
let tokenInput = "";
let loading = false;
let error = "";
let user = "";
let container: HTMLDivElement;

onMount(() => {
	container = document.createElement("div");
	container.id = "login-modal-root";
	document.body.appendChild(container);
	window.addEventListener("open-login", () => {
		show = true;
		render();
	});
	window.addEventListener("login-done", checkLogin);
	checkLogin();
	return () => {
		if (container.parentNode) container.parentNode.removeChild(container);
	};
});

async function checkLogin() {
	const tk = localStorage.getItem("github_token");
	if (tk) {
		const u = await verifyToken(tk);
		if (u) {
			user = u;
			return;
		}
		clearToken();
	}
	user = "";
}

async function handleLogin() {
	const t = tokenInput.trim();
	if (!t) {
		error = "请输入 Token";
		return;
	}
	loading = true;
	error = "";
	try {
		const u = await verifyToken(t);
		if (!u) {
			error = "Token 无效，请检查";
			loading = false;
			return;
		}
		saveToken(t);
		user = u;
		show = false;
		window.dispatchEvent(new CustomEvent("profile-updated"));
		window.dispatchEvent(new CustomEvent("login-done"));
		render();
	} catch (e: any) {
		error = e.message || "登录失败";
	}
	loading = false;
}

async function handleLogout() {
	clearToken();
	user = "";
	window.dispatchEvent(new CustomEvent("profile-updated"));
	render();
}

async function handlePush() {
	loading = true;
	error = "";
	try {
		const data = collectAllData();
		// Try to get existing sha
		let sha: string | null = null;
		try {
			const existing = await fetchData();
			if (existing) sha = existing.sha;
		} catch {}
		await saveData(data, sha);
		error = "";
		render();
		// Show temporary success
		const btn = document.getElementById("push-btn");
		if (btn) {
			btn.textContent = "✅ 已推送";
			setTimeout(() => render(), 2000);
		}
	} catch (e: any) {
		error = `推送失败: ${e.message}`;
		render();
	}
	loading = false;
}

async function handlePull() {
	loading = true;
	error = "";
	try {
		const data = await fetchPublicData<any>();
		if (!data) {
			error = "GitHub 上没有数据";
			loading = false;
			render();
			return;
		}
		applyDataToLocal(data);
		error = "";
		window.dispatchEvent(new CustomEvent("profile-updated"));
		render();
		const btn = document.getElementById("pull-btn");
		if (btn) {
			btn.textContent = "✅ 已同步";
			setTimeout(() => render(), 2000);
		}
	} catch (e: any) {
		error = `同步失败: ${e.message}`;
	}
	loading = false;
}

function close() {
	show = false;
	render();
}

function collectAllData() {
	return {
		profile: JSON.parse(localStorage.getItem("blog-profile") || "{}"),
		about: localStorage.getItem("blog-about") || "",
		skills: JSON.parse(localStorage.getItem("blog-skills") || "[]"),
		settings: {
			hue: localStorage.getItem("hue") || "250",
			"card-radius": localStorage.getItem("card-radius") || "16",
			"layout-density": localStorage.getItem("layout-density") || "normal",
			"font-size": localStorage.getItem("font-size") || "medium",
			"bg-url": localStorage.getItem("bg-url") || "",
			"bg-blur": localStorage.getItem("bg-blur") || "0",
			"card-opacity": localStorage.getItem("card-opacity") || "1",
			"card-blur": localStorage.getItem("card-blur") || "0",
			"page-size": localStorage.getItem("page-size") || "8",
		},
		updatedAt: new Date().toISOString(),
	};
}

function applyDataToLocal(data: any) {
	if (data.profile) setProfile(data.profile);
	if (data.about) setAboutText(data.about);
	if (data.skills) setSkills(data.skills);
	if (data.settings) {
		const s = data.settings;
		if (s.hue) {
			localStorage.setItem("hue", String(s.hue));
			setHue(Number(s.hue));
		}
		if (s["card-radius"]) {
			localStorage.setItem("card-radius", String(s["card-radius"]));
			setCardRadius(Number(s["card-radius"]));
		}
		if (s["layout-density"]) {
			localStorage.setItem("layout-density", s["layout-density"]);
			setLayoutDensity(s["layout-density"]);
		}
		if (s["font-size"]) {
			localStorage.setItem("font-size", s["font-size"]);
			setFontSize(s["font-size"]);
		}
		if (s["bg-url"]) localStorage.setItem("bg-url", s["bg-url"]);
		if (s["bg-blur"]) localStorage.setItem("bg-blur", String(s["bg-blur"]));
		if (s["card-opacity"])
			localStorage.setItem("card-opacity", String(s["card-opacity"]));
		if (s["card-blur"])
			localStorage.setItem("card-blur", String(s["card-blur"]));
		if (s["page-size"])
			localStorage.setItem("page-size", String(s["page-size"]));
	}
}

function render() {
	if (!container) return;
	container.innerHTML = "";

	if (show) {
		const overlay = document.createElement("div");
		overlay.style.cssText =
			"position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35)";
		overlay.addEventListener("click", (e) => {
			if (e.target === e.currentTarget) close();
		});

		const d = document.createElement("div");
		d.style.cssText =
			"background:var(--float-panel-bg);border-radius:var(--radius-large);width:400px;max-width:calc(100vw - 32px);padding:24px;box-shadow:0 8px 40px rgba(0,0,0,0.15)";

		d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="font-size:18px;font-weight:700;color:var(--deep-text)">${user ? "👤 已登录" : "🔑 管理登录"}</span>
        <button id="lg-close" style="width:32px;height:32px;border:none;border-radius:8px;background:var(--btn-regular-bg);color:var(--btn-content);cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
      ${
				user
					? `
        <div style="text-align:center;padding:12px 0;font-size:14px;color:var(--deep-text)">
          已作为 <strong>${user}</strong> 登录
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
          <button id="push-btn" style="flex:1;height:36px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:var(--primary);color:white">📤 推送数据到 GitHub</button>
          <button id="pull-btn" style="flex:1;height:36px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content)">📥 从 GitHub 同步数据</button>
          <button id="lg-logout" style="flex:1;height:36px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:var(--btn-regular-bg);color:#ef4444">退出登录</button>
        </div>
      `
					: `
        <div style="margin-bottom:12px">
          <div style="font-size:13px;font-weight:600;color:var(--deep-text);margin-bottom:4px">GitHub Personal Access Token</div>
          <input id="lg-token" type="password" value="${tokenInput}" placeholder="ghp_xxxxxxxxxxxx" style="width:100%;padding:8px 10px;border:1px solid var(--line-divider);border-radius:8px;font-size:14px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
        </div>
        <div style="font-size:12px;color:var(--meta-divider);margin-bottom:12px">
          Token 需要 <code>repo</code> 权限。
          在 <a href="https://github.com/settings/tokens" target="_blank" style="color:var(--primary)">GitHub Settings → Tokens</a> 生成
        </div>
        <button id="lg-login" style="width:100%;height:36px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:var(--primary);color:white">${loading ? "验证中..." : "登录"}</button>
      `
			}
      ${error ? `<div style="margin-top:12px;font-size:13px;color:#ef4444">${error}</div>` : ""}
    `;

		overlay.appendChild(d);
		container.appendChild(overlay);

		d.querySelector("#lg-close")?.addEventListener("click", close);
		d.querySelector("#lg-login")?.addEventListener("click", handleLogin);
		d.querySelector("#lg-logout")?.addEventListener("click", handleLogout);
		d.querySelector("#push-btn")?.addEventListener("click", handlePush);
		d.querySelector("#pull-btn")?.addEventListener("click", handlePull);
		d.querySelector("#lg-token")?.addEventListener("keyup", (e: any) => {
			tokenInput = e.target.value;
			if (e.key === "Enter") handleLogin();
		});
	}
}
</script>
