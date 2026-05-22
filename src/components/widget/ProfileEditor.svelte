<script lang="ts">
import {
	getAboutText,
	getProfile,
	getSkills,
	type Skill,
	type SocialLink,
	setAboutText,
	setProfile,
	setSkills,
} from "@utils/setting-utils";
import { onDestroy, onMount } from "svelte";

let container: HTMLDivElement;
let mode: "profile" | "about" = "profile";

onMount(() => {
	container = document.createElement("div");
	container.id = "profile-editor-root";
	document.body.appendChild(container);

	window.addEventListener("open-profile-editor", () => {
		mode = "profile";
		render();
	});
	window.addEventListener("open-about-editor", () => {
		mode = "about";
		render();
	});

	return () => {
		if (container.parentNode) container.parentNode.removeChild(container);
	};
});

function close() {
	if (container) container.innerHTML = "";
}

function overlayClick(e: MouseEvent) {
	if (e.target === e.currentTarget) close();
}

// ===== Profile form state =====
const profile = getProfile();
let pName = profile.name;
let pBio = profile.bio;
let pAvatar = profile.avatar;
let pSocial: SocialLink[] = profile.social.length
	? JSON.parse(JSON.stringify(profile.social))
	: [];

// ===== About form state =====
let aboutText = getAboutText();
let skills: Skill[] = getSkills().length
	? JSON.parse(JSON.stringify(getSkills()))
	: [];

function save() {
	if (mode === "profile") {
		setProfile({
			name: pName || "LuoYue",
			bio: pBio,
			avatar: pAvatar,
			social: pSocial.filter((s) => s.platform && s.url),
		});
	} else {
		setAboutText(aboutText);
		setSkills(skills.filter((s) => s.name));
	}
	window.dispatchEvent(new CustomEvent("profile-updated"));
	close();
}

function addSocial() {
	pSocial = [...pSocial, { platform: "", url: "", show: true }];
	render();
}
function removeSocial(i: number) {
	pSocial = pSocial.filter((_, idx) => idx !== i);
	render();
}
function moveSocial(i: number, dir: number) {
	const j = i + dir;
	if (j < 0 || j >= pSocial.length) return;
	const arr = [...pSocial];
	[arr[i], arr[j]] = [arr[j], arr[i]];
	pSocial = arr;
	render();
}
function addSkill() {
	skills = [...skills, { name: "新技能", level: 50 }];
	render();
}
function removeSkill(i: number) {
	skills = skills.filter((_, idx) => idx !== i);
	render();
}

function render() {
	if (!container) return;
	container.innerHTML = "";

	const overlay = document.createElement("div");
	overlay.style.cssText =
		"position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);";
	overlay.addEventListener("click", overlayClick);

	const dialog = document.createElement("div");
	dialog.style.cssText =
		"background:var(--float-panel-bg);border-radius:var(--radius-large);width:500px;max-width:calc(100vw - 32px);max-height:calc(100vh - 40px);overflow-y:auto;padding:24px;box-shadow:0 8px 40px rgba(0,0,0,0.15);";

	if (mode === "profile") {
		dialog.innerHTML = profileFormHTML();
	} else {
		dialog.innerHTML = aboutFormHTML();
	}

	overlay.appendChild(dialog);
	container.appendChild(overlay);

	// Bind events
	dialog.querySelector("#pe-close")?.addEventListener("click", close);
	dialog.querySelector("#pe-save")?.addEventListener("click", save);
	dialog.querySelector("#pe-cancel")?.addEventListener("click", close);
	dialog.querySelector("#pe-add-social")?.addEventListener("click", addSocial);
	dialog.querySelector("#pe-add-skill")?.addEventListener("click", addSkill);
	dialog
		.querySelectorAll(".pe-del-social")
		.forEach((el) =>
			el.addEventListener("click", () =>
				removeSocial(Number.parseInt((el as HTMLElement).dataset.idx!, 10)),
			),
		);
	dialog
		.querySelectorAll(".pe-up-social")
		.forEach((el) =>
			el.addEventListener("click", () =>
				moveSocial(Number.parseInt((el as HTMLElement).dataset.idx!, 10), -1),
			),
		);
	dialog
		.querySelectorAll(".pe-down-social")
		.forEach((el) =>
			el.addEventListener("click", () =>
				moveSocial(Number.parseInt((el as HTMLElement).dataset.idx!, 10), 1),
			),
		);
	dialog
		.querySelectorAll(".pe-del-skill")
		.forEach((el) =>
			el.addEventListener("click", () =>
				removeSkill(Number.parseInt((el as HTMLElement).dataset.idx!, 10)),
			),
		);
	// Input changes
	dialog.querySelector("#pe-name")?.addEventListener("input", (e: Event) => {
		pName = (e.target as HTMLInputElement).value;
	});
	dialog.querySelector("#pe-bio")?.addEventListener("input", (e: Event) => {
		pBio = (e.target as HTMLTextAreaElement).value;
	});
	dialog.querySelector("#pe-avatar")?.addEventListener("input", (e: Event) => {
		pAvatar = (e.target as HTMLInputElement).value;
	});
	dialog
		.querySelector("#pe-about-text")
		?.addEventListener("input", (e: Event) => {
			aboutText = (e.target as HTMLTextAreaElement).value;
		});
	dialog.querySelectorAll(".pe-social-name").forEach((el) =>
		el.addEventListener("input", (e: Event) => {
			pSocial[Number.parseInt((el as HTMLElement).dataset.idx!, 10)].platform =
				(e.target as HTMLInputElement).value;
		}),
	);
	dialog.querySelectorAll(".pe-social-url").forEach((el) =>
		el.addEventListener("input", (e: Event) => {
			pSocial[Number.parseInt((el as HTMLElement).dataset.idx!, 10)].url = (
				e.target as HTMLInputElement
			).value;
		}),
	);
	dialog.querySelectorAll(".pe-skill-name").forEach((el) =>
		el.addEventListener("input", (e: Event) => {
			skills[Number.parseInt((el as HTMLElement).dataset.idx!, 10)].name = (
				e.target as HTMLInputElement
			).value;
		}),
	);
	dialog.querySelectorAll(".pe-skill-level").forEach((el) =>
		el.addEventListener("input", (e: Event) => {
			skills[Number.parseInt((el as HTMLElement).dataset.idx!, 10)].level =
				Number.parseInt((e.target as HTMLInputElement).value, 10);
			const pct = dialog.querySelector(
				`.pe-skill-pct[data-idx="${(el as HTMLElement).dataset.idx}"]`,
			);
			if (pct) pct.textContent = `${(e.target as HTMLInputElement).value}%`;
		}),
	);
}

function escAttr(s: string) {
	return s
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function profileFormHTML() {
	return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-size:18px;font-weight:700;color:var(--deep-text)">✏ 编辑个人信息</span>
      <button id="pe-close" style="width:32px;height:32px;border:none;border-radius:8px;background:var(--btn-regular-bg);color:var(--btn-content);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;">✕</button>
    </div>
    <div style="margin-bottom:12px">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:var(--deep-text)">名字</label>
      <input id="pe-name" type="text" value="${escAttr(pName)}" style="width:100%;padding:8px 10px;border:1px solid var(--line-divider);border-radius:8px;font-size:14px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
    </div>
    <div style="margin-bottom:12px">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:var(--deep-text)">简介</label>
      <textarea id="pe-bio" rows="2" style="width:100%;padding:8px 10px;border:1px solid var(--line-divider);border-radius:8px;font-size:14px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);resize:vertical;font-family:inherit">${escAttr(pBio)}</textarea>
    </div>
    <div style="margin-bottom:12px">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:var(--deep-text)">头像 URL</label>
      <input id="pe-avatar" type="text" value="${escAttr(pAvatar)}" style="width:100%;padding:8px 10px;border:1px solid var(--line-divider);border-radius:8px;font-size:14px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--meta-divider);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line-divider);display:flex;align-items:center;justify-content:space-between">
      社交链接
      <button id="pe-add-social" style="padding:4px 10px;font-size:12px;font-weight:600;border:none;border-radius:6px;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content)">＋ 添加</button>
    </div>
    ${pSocial
			.map(
				(s, i) => `
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
        <input class="pe-social-name" data-idx="${i}" type="text" value="${escAttr(s.platform)}" placeholder="GitHub" style="flex:1;padding:6px 8px;border:1px solid var(--line-divider);border-radius:6px;font-size:13px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
        <input class="pe-social-url" data-idx="${i}" type="text" value="${escAttr(s.url)}" placeholder="https://github.com/xxx" style="flex:1;padding:6px 8px;border:1px solid var(--line-divider);border-radius:6px;font-size:13px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
        <button class="pe-up-social" data-idx="${i}" style="padding:4px 6px;min-width:26px;font-size:12px;border:none;border-radius:5px;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content);${i === 0 ? "opacity:0.3" : ""}" ${i === 0 ? "disabled" : ""}>▲</button>
        <button class="pe-down-social" data-idx="${i}" style="padding:4px 6px;min-width:26px;font-size:12px;border:none;border-radius:5px;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content);${i === pSocial.length - 1 ? "opacity:0.3" : ""}" ${i === pSocial.length - 1 ? "disabled" : ""}>▼</button>
        <button class="pe-del-social" data-idx="${i}" style="padding:4px 6px;min-width:26px;font-size:12px;border:none;border-radius:5px;cursor:pointer;background:var(--btn-regular-bg);color:#ef4444">✕</button>
      </div>
    `,
			)
			.join("")}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
      <button id="pe-cancel" style="padding:8px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content)">取消</button>
      <button id="pe-save" style="padding:8px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:var(--primary);color:white">💾 保存</button>
    </div>
  `;
}

function aboutFormHTML() {
	return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <span style="font-size:18px;font-weight:700;color:var(--deep-text)">✏ 编辑关于我</span>
      <button id="pe-close" style="width:32px;height:32px;border:none;border-radius:8px;background:var(--btn-regular-bg);color:var(--btn-content);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;">✕</button>
    </div>
    <div style="margin-bottom:12px">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px;color:var(--deep-text)">关于我</label>
      <textarea id="pe-about-text" rows="4" style="width:100%;padding:8px 10px;border:1px solid var(--line-divider);border-radius:8px;font-size:14px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);resize:vertical;font-family:inherit">${escAttr(aboutText)}</textarea>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--meta-divider);text-transform:uppercase;letter-spacing:0.5px;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line-divider);display:flex;align-items:center;justify-content:space-between">
      编程语言掌握度
      <button id="pe-add-skill" style="padding:4px 10px;font-size:12px;font-weight:600;border:none;border-radius:6px;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content)">＋ 添加</button>
    </div>
    ${skills
			.map(
				(sk, i) => `
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
        <input class="pe-skill-name" data-idx="${i}" type="text" value="${escAttr(sk.name)}" placeholder="语言" style="width:90px;padding:6px 8px;border:1px solid var(--line-divider);border-radius:6px;font-size:13px;box-sizing:border-box;background:var(--card-bg);color:var(--deep-text);outline:none">
        <input class="pe-skill-level" data-idx="${i}" type="range" min="0" max="100" value="${sk.level}" style="flex:1;height:6px;-webkit-appearance:none;background:var(--line-divider);border-radius:3px;outline:none;cursor:pointer">
        <span class="pe-skill-pct" data-idx="${i}" style="font-size:13px;color:var(--meta-divider);width:36px;text-align:right">${sk.level}%</span>
        <button class="pe-del-skill" data-idx="${i}" style="padding:4px 6px;min-width:26px;font-size:12px;border:none;border-radius:5px;cursor:pointer;background:var(--btn-regular-bg);color:#ef4444">✕</button>
      </div>
    `,
			)
			.join("")}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
      <button id="pe-cancel" style="padding:8px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:var(--btn-regular-bg);color:var(--btn-content)">取消</button>
      <button id="pe-save" style="padding:8px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:var(--primary);color:white">💾 保存</button>
    </div>
  `;
}
</script>
