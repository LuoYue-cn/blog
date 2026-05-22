import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) return;
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}
	document.documentElement.setAttribute("data-theme", expressiveCodeConfig.theme);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}

// ======== 卡片圆角 ========
export function getCardRadius(): number {
	const stored = localStorage.getItem("card-radius");
	return stored ? Number.parseInt(stored, 10) : 16;
}
export function setCardRadius(radius: number): void {
	localStorage.setItem("card-radius", String(radius));
	document.documentElement.style.setProperty("--radius-large", `${radius}px`);
}

// ======== 布局密度 ========
export type LayoutDensity = "compact" | "normal" | "comfortable";
export function getLayoutDensity(): LayoutDensity {
	return (localStorage.getItem("layout-density") as LayoutDensity) || "normal";
}
export function setLayoutDensity(density: LayoutDensity): void {
	localStorage.setItem("layout-density", density);
	const spacings: Record<LayoutDensity, { gap: string; padding: string }> = {
		compact: { gap: "0.5rem", padding: "0.75rem" },
		normal: { gap: "1rem", padding: "1rem" },
		comfortable: { gap: "1.5rem", padding: "1.5rem" },
	};
	const s = spacings[density];
	document.documentElement.style.setProperty("--layout-gap", s.gap);
	document.documentElement.style.setProperty("--layout-card-padding", s.padding);
}

// ======== 字体大小 ========
export type FontSize = "small" | "medium" | "large";
export function getFontSize(): FontSize {
	return (localStorage.getItem("font-size") as FontSize) || "medium";
}
export function setFontSize(size: FontSize): void {
	localStorage.setItem("font-size", size);
	const sizes: Record<FontSize, string> = {
		small: "13px",
		medium: "16px",
		large: "18px",
	};
	document.documentElement.style.fontSize = sizes[size];
}

// ======== 个人资料 ========
export interface SocialLink {
	platform: string;
	url: string;
	show?: boolean;
}
export interface ProfileData {
	name: string;
	bio: string;
	avatar: string;
	social: SocialLink[];
}
export function getProfile(): ProfileData {
	try {
		return JSON.parse(localStorage.getItem("blog-profile") || "null") || { name: "", bio: "", avatar: "", social: [] };
	} catch { return { name: "", bio: "", avatar: "", social: [] }; }
}
export function setProfile(p: ProfileData): void {
	localStorage.setItem("blog-profile", JSON.stringify(p));
}

// ======== 关于我 ========
export function getAboutText(): string {
	return localStorage.getItem("blog-about") || "";
}
export function setAboutText(text: string): void {
	localStorage.setItem("blog-about", text);
}

// ======== 技能熟练度 ========
export interface Skill {
	name: string;
	level: number;
}
export function getSkills(): Skill[] {
	try {
		return JSON.parse(localStorage.getItem("blog-skills") || "[]");
	} catch { return []; }
}
export function setSkills(skills: Skill[]): void {
	localStorage.setItem("blog-skills", JSON.stringify(skills));
}
