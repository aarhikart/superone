"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Search,
  Plus,
  Trash2,
  Cake,
  Award,
  Heart,
  Users,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Check,
} from "lucide-react";
import Swal from "sweetalert2";

const ALL_CATEGORIES = [
  "All Assets",
  "Birthdays",
  "Work Anniversaries",
  "Personal Anniversaries",
];

const TARGET_AUDIENCES = ["All Staff", "Leadership", "Engineering", "Marketing", "Design", "Sales", "HR", "Finance"];

export default function CelebrationGalleryModal({
  isOpen,
  onClose,
  selectMode = false,
  initialTab = "All Assets",
  lockCategory = false,
  onSelectAsset = null,
  selectedAssetId = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "All Assets");
  const [search, setSearch] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Birthdays");
  const [uploadTargetAudience, setUploadTargetAudience] = useState("All Staff");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab !== "All Assets") {
        setUploadCategory(initialTab);
      }
    }
  }, [initialTab, isOpen]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const catParam = activeTab === "All Assets" ? "" : activeTab;
      const res = await fetch(`/api/celebrations/assets?category=${encodeURIComponent(catParam)}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, activeTab]);

  const handleDeleteAsset = async (asset, e) => {
    e?.stopPropagation?.();
    const result = await Swal.fire({
      title: "Delete Celebration Image?",
      text: `Are you sure you want to delete "${asset.title}" from the ${asset.category} gallery?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      background: "#ffffff",
      color: "#0f172a",
      customClass: {
        popup: "rounded-3xl shadow-2xl border border-slate-100",
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/celebrations/assets/${asset._id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to delete asset.");
        }

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Image asset removed from gallery.",
          confirmButtonColor: "#4318FF",
          background: "#ffffff",
          color: "#0f172a",
          customClass: {
            popup: "rounded-3xl shadow-2xl border border-slate-100",
          },
        });

        fetchAssets();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Cannot Delete",
          text: err.message || "Failed to delete asset.",
          confirmButtonColor: "#4318FF",
        });
      }
    }
  };

  const handleFilesChosen = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 10) {
      setUploadError("Maximum 10 images can be uploaded at a time.");
      return;
    }

    const validFiles = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setUploadError(`"${f.name}" exceeds the 5MB file size limit.`);
        return;
      }
      validFiles.push(f);
    }

    const updated = [...selectedFiles, ...validFiles];
    setSelectedFiles(updated);

    // Show 100% immediately for all selected images as requested
    const newProgress = {};
    updated.forEach((_, idx) => {
      newProgress[idx] = 100;
    });
    setUploadProgress(newProgress);
    setUploadError("");
  };

  const handleRemoveSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Please select at least one image to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("category", uploadCategory);
      formData.append("targetAudience", uploadTargetAudience);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/celebrations/assets", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload images.");
      }

      await Swal.fire({
        icon: "success",
        title: "Upload Successful!",
        text: `${selectedFiles.length} celebration image(s) added to the ${uploadCategory} gallery.`,
        confirmButtonColor: "#4318FF",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-3xl shadow-2xl border border-slate-100",
        },
      });

      setIsUploadOpen(false);
      setSelectedFiles([]);
      setUploadProgress({});
      fetchAssets();
    } catch (err) {
      setUploadError(err.message || "Failed to upload images.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAssetCard = (asset) => {
    if (selectMode && onSelectAsset) {
      onSelectAsset(asset);
      onClose();
    }
  };

  const availableCategories = lockCategory && initialTab !== "All Assets"
    ? [initialTab]
    : ALL_CATEGORIES;

  const filteredAssets = assets.filter((asset) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      asset.title.toLowerCase().includes(term) ||
      asset.category.toLowerCase().includes(term) ||
      (asset.targetAudience && asset.targetAudience.toLowerCase().includes(term))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Gallery Top Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {selectMode ? `Select Email Image (${activeTab})` : "Celebration Gallery"}
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#4318FF]">
                {filteredAssets.length} Assets
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {selectMode
                ? `Choose a banner image from the ${activeTab} gallery to send in the celebration email.`
                : "Manage visual assets and headlines for automated milestones."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gallery..."
                className="w-48 sm:w-60 rounded-full bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4318FF]/20 border border-slate-200"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedFiles([]);
                setUploadError("");
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 rounded-full bg-[#4318FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3713d9] transition"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Assets</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Gallery Tabs */}
        <div className="px-8 border-b border-slate-100 flex items-center gap-6 overflow-x-auto text-xs font-bold">
          {availableCategories.map((cat) => {
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveTab(cat)}
                className={`py-3.5 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-[#4318FF] text-[#4318FF]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Cards Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4318FF]" />
              <p className="mt-3 text-xs text-slate-500">Loading gallery assets...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-20 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">
                No visual assets found in {activeTab}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Click "Upload Assets" to add celebration banner images.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => {
                const isBirthday = asset.category === "Birthdays";
                const isWork = asset.category === "Work Anniversaries";
                const isSelected = selectedAssetId === asset._id;

                return (
                  <div
                    key={asset._id}
                    onClick={() => selectMode && handleSelectAssetCard(asset)}
                    className={`group relative rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col ${
                      selectMode ? "cursor-pointer hover:border-[#4318FF] hover:ring-2 hover:ring-[#4318FF]/20" : ""
                    } ${isSelected ? "border-[#4318FF] ring-2 ring-[#4318FF]" : "border-slate-100"}`}
                  >
                    {/* Image Preview */}
                    <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.imageUrl}
                        alt={asset.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {!selectMode && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAsset(asset, e)}
                          title="Delete Image"
                          className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {selectMode && isSelected && (
                        <span className="absolute top-2 right-2 rounded-full bg-[#4318FF] p-1 text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h4 className="font-bold text-slate-900 text-sm truncate" title={asset.title}>
                        {asset.title}
                      </h4>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-[#4318FF]">
                          {asset.targetAudience || "All Staff"}
                        </span>

                        <div className="text-slate-400">
                          {isBirthday ? (
                            <Cake className="h-4 w-4 text-pink-500" />
                          ) : isWork ? (
                            <Award className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <Heart className="h-4 w-4 text-rose-500" />
                          )}
                        </div>
                      </div>

                      {selectMode && (
                        <button
                          type="button"
                          onClick={() => handleSelectAssetCard(asset)}
                          className="mt-3 w-full rounded-xl bg-[#4318FF] py-1.5 text-xs font-bold text-white hover:bg-[#3713d9] transition text-center"
                        >
                          {isSelected ? "Selected Email Image" : "Use This Email Image"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upload Celebration Assets Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Upload Celebration Assets
                </h3>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {uploadError && (
                  <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Category Pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    Select Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Birthdays", "Work Anniversaries", "Personal Anniversaries"].map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setUploadCategory(cat)}
                          className={`rounded-full px-4 py-1.5 text-xs font-bold transition border ${
                            uploadCategory === cat
                              ? "border-[#4318FF] bg-indigo-50/50 text-[#4318FF]"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-indigo-200 bg-slate-50/50 p-8 text-center cursor-pointer hover:bg-indigo-50/30 transition flex flex-col items-center justify-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#4318FF] mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Drag and drop your images here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or <span className="text-[#4318FF] font-semibold">Browse Files</span>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesChosen}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                  <span>Max 10 images at a time</span>
                  <span>Max file size: 5MB per image</span>
                </div>

                {/* Selected Files List with 100% Progress Bar */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2.5 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, idx) => {
                      const progress = uploadProgress[idx] || 100;
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center gap-3"
                        >
                          <FileImage className="h-5 w-5 text-indigo-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                              <span className="truncate">{file.name}</span>
                              <span className="text-emerald-600 ml-2 font-mono text-[11px] font-bold">
                                {progress}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedFile(idx)}
                            className="text-slate-400 hover:text-slate-700 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="flex items-center gap-2 rounded-full bg-[#4318FF] px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#3713d9] transition disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload {selectedFiles.length}/10 Images</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
