"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Roboto_Slab, Montserrat } from "next/font/google";
import Menu from "@/components/Menu";
import Footer from "@/components/Footer";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600"] });

interface Sponsor {
  id?: number;
  name: string;
  badge: string;
  logo: string;
  url: string;
  tagline: string;
  description: string;
  button_label: string;
  highlight_color: string;
  display_order: number;
}

const emptyForm: Sponsor = {
  name: "",
  badge: "Club Sponsor",
  logo: "",
  url: "",
  tagline: "",
  description: "",
  button_label: "Visit website",
  highlight_color: "emerald",
  display_order: 1,
};

function getLogoTitle(logoUrl: string, uploadedName?: string, sponsorName?: string): string {
  if (uploadedName && uploadedName.trim()) {
    return uploadedName.trim();
  }
  if (!logoUrl) return "";
  if (logoUrl.startsWith("data:")) {
    return sponsorName && sponsorName.trim()
      ? `${sponsorName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}_logo.png`
      : "uploaded_logo.png";
  }
  try {
    const urlParts = logoUrl.split("/");
    const lastPart = urlParts[urlParts.length - 1] || "";
    const cleanName = lastPart.split("?")[0];
    if (cleanName && cleanName.length > 0 && cleanName.length < 60) {
      return decodeURIComponent(cleanName);
    }
  } catch {
    // fallback
  }
  return sponsorName && sponsorName.trim()
    ? `${sponsorName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}_logo.png`
    : "sponsor_logo.png";
}

export default function SponsorsCMSPage() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Sponsor>(emptyForm);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // File upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sponsors from DB
  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sponsors?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.sponsors)) {
        setSponsors(data.sponsors);
      }
    } catch (err) {
      console.error("Failed to load sponsors:", err);
      setStatusMessage({ type: "error", text: "Failed to load sponsors from database." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  // Handle direct file upload to Vercel Blob
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadError("");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("sponsorName", formData.name || "sponsor");
      if (formData.logo) {
        uploadFormData.append("oldLogoUrl", formData.logo);
      }

      const res = await fetch("/api/upload/sponsor-logo", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Update logo URL directly with the Vercel Blob URL or fallback
      setFormData((prev) => ({ ...prev, logo: data.url }));
      setLogoFileName(data.fileName || file.name);
      setStatusMessage({ type: "success", text: "Logo uploaded successfully!" });
    } catch (err: any) {
      console.error("Vercel Blob upload error:", err);
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStartAdd = () => {
    setFormData({
      ...emptyForm,
      display_order: sponsors.length + 1,
    });
    setLogoFileName("");
    setIsEditing(true);
    setStatusMessage(null);
    setUploadError("");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleStartEdit = (s: Sponsor) => {
    setFormData({ ...s });
    setLogoFileName(getLogoTitle(s.logo, "", s.name));
    setIsEditing(true);
    setStatusMessage(null);
    setUploadError("");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(emptyForm);
    setLogoFileName("");
    setUploadError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim() || !formData.logo.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a sponsor name, website link, and upload a logo." });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: "info", text: "Saving sponsor..." });

    try {
      const isUpdate = Boolean(formData.id);
      const res = await fetch("/api/sponsors", {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Save failed");
      }

      setStatusMessage({
        type: "success",
        text: isUpdate ? `Updated "${formData.name}" successfully!` : `Added "${formData.name}" successfully!`,
      });
      setIsEditing(false);
      setFormData(emptyForm);
      setLogoFileName("");
      await fetchSponsors();
    } catch (err: any) {
      console.error("Error saving sponsor:", err);
      setStatusMessage({ type: "error", text: err.message || "Could not save sponsor." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number, name?: string) => {
    if (!id) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name || "this sponsor"}"? The logo will also be removed from storage.`);
    if (!confirmDelete) return;

    setStatusMessage({ type: "info", text: "Deleting sponsor..." });

    try {
      const res = await fetch(`/api/sponsors?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Delete failed");
      }

      setStatusMessage({ type: "success", text: `Deleted "${name || "sponsor"}" successfully.` });
      if (formData.id === id) {
        setIsEditing(false);
        setFormData(emptyForm);
      }
      await fetchSponsors();
    } catch (err: any) {
      console.error("Delete sponsor error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to delete sponsor." });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-900 text-white">
      <Menu />

      {/* Header Banner */}
      <section
        className="w-full flex justify-center items-center py-10 px-4 bg-gray-900"
        style={{ background: "linear-gradient(135deg, #232526 0%, #414345 100%)" }}
      >
        <div className="max-w-3xl w-full flex flex-col items-center text-center mt-16 sm:mt-28">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
            <span>🤝</span>
            <span>Partners &amp; Sponsors CMS</span>
          </div>

          <h1
            className={`text-3xl sm:text-5xl font-extrabold mb-4 ${robotoSlab.className}`}
            style={{
              letterSpacing: "0.05em",
              textShadow: "0 0 4px #0b3d1a, 0 2px 0 #0b3d1a",
            }}
          >
            Manage Club Sponsors
          </h1>

          <p className={`text-base sm:text-lg text-gray-300 max-w-xl mb-6 ${montserrat.className}`}>
            Add, edit, or remove official club sponsors. Logo uploads connect directly to <strong>Vercel Blob storage</strong> so your images are fast and cloud-hosted.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cms"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold border border-gray-700 transition"
            >
              ← Back to CMS Overview
            </Link>

            <Link
              href="/#sponsors"
              target="_blank"
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow"
            >
              <span>View live sponsors on homepage</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="w-full max-w-5xl px-4 py-10 flex flex-col items-center gap-8">
        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`w-full p-4 rounded-xl text-sm font-medium border flex items-center justify-between gap-3 ${
              statusMessage.type === "success"
                ? "bg-green-950/80 border-green-500 text-green-300"
                : statusMessage.type === "error"
                ? "bg-red-950/80 border-red-500 text-red-300"
                : "bg-blue-950/80 border-blue-500 text-blue-300"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-white text-lg leading-none"
            >
              &times;
            </button>
          </div>
        )}

        {/* Top Controls: Add Button */}
        {!isEditing && (
          <div className="w-full flex justify-between items-center bg-gray-800/80 p-4 sm:p-5 rounded-2xl border border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white">Current Sponsors ({sponsors.length})</h2>
              <p className="text-xs sm:text-sm text-gray-400">Manage the sponsors shown in the rotating carousel on the home and fixtures pages.</p>
            </div>
            <button
              type="button"
              onClick={handleStartAdd}
              className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span>+ Add Sponsor</span>
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {isEditing && (
          <div className="w-full bg-gray-850 p-6 sm:p-8 rounded-2xl border-2 border-emerald-500/60 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>{formData.id ? "✏️ Edit Sponsor" : "➕ Add New Sponsor"}</span>
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-400 hover:text-white text-sm font-semibold p-1"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Sponsor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Momo Barbershop"
                    className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Website URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://www.momobarbershop.com/"
                    className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Badge / Partner Category
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Official Barbershop or Club Sponsor"
                    className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>

                {/* Button label */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.button_label}
                    onChange={(e) => setFormData({ ...formData, button_label: e.target.value })}
                    placeholder="e.g. Visit momobarbershop.com"
                    className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Display Order (Sorting Priority)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">1 appears first, 2 second, etc.</span>
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Tagline (Short Subtitle)
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. FC Mierda's favorite barbershop"
                    className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Description / Subtext
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write a description or friendly blurb about the sponsor..."
                  className="w-full p-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              {/* Vercel Blob Logo Upload */}
              <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-700 space-y-3">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Sponsor Logo (Uploaded directly to Vercel Blob) *
                </label>

                {/* Current or Uploaded Logo Preview */}
                {formData.logo ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-lg bg-gray-950 border border-gray-800">
                    <div className="relative w-36 h-24 rounded bg-gray-900 flex items-center justify-center p-2 border border-gray-700 overflow-hidden">
                      <Image
                        src={formData.logo}
                        alt="Logo preview"
                        width={144}
                        height={96}
                        className="max-h-full max-w-full object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs text-green-400 font-semibold mb-1 flex items-center gap-1.5">
                        <span>✓</span>
                        <span>Logo ready</span>
                      </div>
                      <p
                        className="text-xs text-gray-200 font-medium truncate max-w-md"
                        title={getLogoTitle(formData.logo, logoFileName, formData.name)}
                      >
                        {getLogoTitle(formData.logo, logoFileName, formData.name)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-600 transition"
                    >
                      {uploadingLogo ? "Uploading..." : "Replace Logo"}
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-500/70 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-950/40"
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <p className="text-sm font-semibold text-gray-200">
                      Click to upload sponsor logo to Vercel
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports PNG, JPEG, SVG, WebP (max 5MB)
                    </p>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadingLogo && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Uploading image directly to Vercel Blob...</span>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-red-400 font-semibold">{uploadError}</p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploadingLogo}
                  className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : formData.id ? "Update Sponsor" : "Save Sponsor"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sponsor Cards Grid */}
        <div className="w-full space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-400 bg-gray-800 rounded-2xl border border-gray-700 animate-pulse">
              Loading sponsors from database...
            </div>
          ) : sponsors.length === 0 ? (
            <div className="p-10 text-center text-gray-400 bg-gray-800 rounded-2xl border border-gray-700 space-y-3">
              <div className="text-4xl">🤝</div>
              <h3 className="text-lg font-bold text-white">No sponsors yet</h3>
              <p className="text-sm text-gray-400">Click &ldquo;+ Add Sponsor&rdquo; above to create your first sponsor card.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {sponsors.map((s) => (
                <div
                  key={s.id}
                  className="p-5 sm:p-6 rounded-2xl bg-gray-800/90 border border-gray-700 hover:border-gray-600 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top: Logo + Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-24 h-16 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center p-2 flex-shrink-0 overflow-hidden">
                        {s.logo ? (
                          <Image
                            src={s.logo}
                            alt={s.name}
                            width={96}
                            height={64}
                            className="max-h-full max-w-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-gray-500">No logo</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                          {s.badge || "Sponsor"}
                        </span>
                        <div className="text-[11px] text-gray-400 mt-1">Order #{s.display_order}</div>
                      </div>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{s.name}</h3>
                    {s.tagline && <p className="text-xs font-semibold text-emerald-400 mb-2">{s.tagline}</p>}
                    {s.description && (
                      <p className="text-xs text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-400 truncate mb-4">
                      <span className="text-gray-500">Link: </span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {s.url}
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-700/60">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(s)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-semibold transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id, s.name)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
