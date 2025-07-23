"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CommandMenu from "@/CommandMenu";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { IconPicker } from "@/components/ui/icon-picker";
import * as Icons from "lucide-react";
import { PlusIcon, Check, Plus } from "lucide-react";
import {
  Search,
  Archive,
  Edit3,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronDown,
  Folder,
} from "lucide-react";
import { IconName } from "lucide-react/dynamic";

import { Bookmark } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { v4 as uuid } from "uuid";
import { Toaster, toast } from "sonner";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

function getFavicon(url: string) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

function toPascalCase(str: string) {
  return str
    .replace(/[-_]+/g, " ")
    .replace(/\s+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/\s/g, "")
    .replace(/^(.)/, (_, chr) => chr.toUpperCase());
}

import { LucideIcon } from "lucide-react";

function Icon({ name, ...props }: { name: string; className?: string }) {
  const safeName = toPascalCase(name);
  const LucideIconComponent = Icons[
    safeName as keyof typeof Icons
  ] as LucideIcon;

  if (!LucideIconComponent) {
    return <Icons.Folder {...props} />;
  }

  return <LucideIconComponent {...props} />;
}

function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setValue(JSON.parse(saved));
      } catch {
        setValue(initial);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, setValue] as const;
}

export default function BookmarkApp() {
  type Folder = {
    name: string;
    icon: string;
  };

  const [folders, setFolders] = usePersistentState<Folder[]>("folders", [
    { name: "General", icon: "Folder" },
  ]);
  const [bookmarks, setBookmarks] = usePersistentState<Bookmark[]>(
    "bookmarks",
    []
  );
  const [globalTags, setGlobalTags] = usePersistentState<string[]>("tags", []);

  const [modalOpen, setModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState<IconName>("folder");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("General");
  const [remindAt, setRemindAt] = useState<Date | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const lastAction = useRef<(() => void) | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const visibleBookmarks = (
    searchQuery
      ? bookmarks.filter((b) => {
          const search = searchQuery.toLowerCase();
          return (
            b.title.toLowerCase().includes(search) ||
            b.url.toLowerCase().includes(search) ||
            b.tags.some((tag) => tag.toLowerCase().includes(search)) ||
            b.folder.toLowerCase().includes(search)
          );
        })
      : selectedTag
      ? bookmarks.filter((b) => b.tags.includes(selectedTag))
      : bookmarks.filter((b) => b.folder === folder)
  )
    .filter((b) => (showArchived ? b.isArchived : !b.isArchived))
    .slice()
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
    });

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const text = e.clipboardData?.getData("text");
    if (text && (text.startsWith("http") || text.startsWith("www"))) {
      setUrl(text);
      setTitle("");
      setRemindAt(undefined);
      setFolder("General");
      setTags([]);
      setModalOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    setFolders((prev) =>
      prev.map((f) => ({
        ...f,
        icon: f.icon === "Folder" ? "folder" : f.icon,
      }))
    );
  }, []);

  useEffect(() => {
    setBookmarks((prev) =>
      prev.map((b) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        remindAt: b.remindAt ? new Date(b.remindAt) : undefined,
      }))
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "/" && !modalOpen) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (lastAction.current) {
          lastAction.current();
          toast("Undo successful!");
          lastAction.current = null;
        }
      }
      if (e.key === "Escape") {
        setModalOpen(false);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !modalOpen) {
        e.preventDefault();
        if (visibleBookmarks.length > 0) {
          const b = visibleBookmarks[0];
          setBookmarks(
            bookmarks.map((bm) =>
              bm.id === b.id ? { ...bm, isArchived: !bm.isArchived } : bm
            )
          );
          toast(`Bookmark ${b.isArchived ? "unarchived" : "archived"}`);
        }
      }
    },
    [modalOpen, bookmarks, visibleBookmarks]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const saveBookmark = () => {
    if (!title || !url) return;

    if (editingBookmark) {
      const updated = bookmarks.map((b) =>
        b.id === editingBookmark.id
          ? { ...b, title, url, folder, remindAt, tags, notes }
          : b
      );
      setBookmarks(updated);
      setEditingBookmark(null);
    } else {
      const newBm: Bookmark = {
        id: uuid(),
        title,
        url,
        folder,
        remindAt,
        createdAt: new Date(),
        isArchived: false,
        tags,
        notes,
      };
      setBookmarks([newBm, ...bookmarks]);
    }
    tags.forEach((t) => {
      if (!globalTags.includes(t)) {
        setGlobalTags([...globalTags, t]);
      }
    });

    setTitle("");
    setUrl("");
    setRemindAt(undefined);
    setTags([]);
    setTagInput("");
    setModalOpen(false);
  };

  const addFolder = () => {
    const name = prompt("New folder name");
    if (name && !folders.some((f) => f.name === name)) {
      setFolders([...folders, { name, icon: "folder" }]);
      setFolder(name);
    }
  };

  const deleteBookmark = (b: Bookmark) => {
    setBookmarks((currentBookmarks) => {
      const updated = currentBookmarks.filter((bm) => bm.id !== b.id);
      lastAction.current = () => {
        setBookmarks((current) => {
          if (current.some((bm) => bm.id === b.id)) {
            return current;
          }
          return [b, ...current];
        });
      };

      return updated;
    });

    toast("Deleted bookmark", {
      action: {
        label: "Undo",
        onClick: () => {
          lastAction.current?.();
          lastAction.current = null;
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="p-8 bg-gray-50 overflow-y-auto min-h-screen">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="w-full">
            <div className="flex items-center justify-between gap-3 px-3 py-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  ref={searchRef}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedTag(null);
                  }}
                  className="w-full h-10 pl-8 pr-3 text-xs font-mono border border-dotted border-gray-300 rounded-none bg-white focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="h-10 px-3 text-xs font-mono border border-dotted border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 group rounded-none flex items-center"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                New
              </button>
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}
              >
                <SelectTrigger className="w-10 h-10 flex items-center justify-center text-xs font-mono border border-dotted border-gray-300 bg-white rounded-none">
                  <ChevronDown className="w-4 h-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest to Oldest</SelectItem>
                  <SelectItem value="oldest">Oldest to Newest</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-10 h-10 flex items-center justify-center text-xs font-mono border border-dotted border-gray-300 bg-white hover:bg-gray-50 rounded-none"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? (
                  <Archive className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="w-full py-2 px-3 flex gap-2 overflow-x-auto">
              {folders.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    setSelectedTag(null);
                    setSearchQuery("");
                    setFolder(f.name);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-mono rounded-none transition-colors
        ${
          folder === f.name
            ? "bg-gray-900 text-white "
            : "bg-white text-gray-700 hover:bg-gray-100"
        }
      `}
                >
                  <Icon name={f.icon} className="w-3.5 h-3.5" />
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          {searchQuery === "" && globalTags.length > 0 && (
            <div className=" w-full">
              <div className="flex gap-1 flex-wrap px-3 py-2 w-full">
                <button
                  className={`px-2 py-1 text-xs font-mono border bg-gray-50 hover:bg-gray-100 transition-colors rounded-none ${
                    selectedTag === null
                      ? "bg-gray-50 text-gray-900"
                      : "bg-white text-gray-600"
                  }`}
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </button>
                {globalTags.map((tag) => (
                  <button
                    key={tag}
                    className={`px-2 py-1 text-xs font-mono border  hover:bg-gray-50 transition-colors rounded-none ${
                      selectedTag === tag
                        ? "bg-gray-50 text-gray-900"
                        : "bg-white text-gray-600"
                    }`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="w-full px-3 py-3">
            <div className="space-y-2 w-full">
              {visibleBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="group border border-dotted border-gray-300 bg-white hover:border-gray-400 transition-all duration-200 relative w-full"
                >
                  <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Plus className="w-2 h-2 text-gray-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Plus className="w-2 h-2 text-gray-600" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Plus className="w-2 h-2 text-gray-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Plus className="w-2 h-2 text-gray-600" />
                  </div>

                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={getFavicon(bookmark.url)}
                            alt=""
                            className="w-4 h-4 rounded"
                          />
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                          >
                            {bookmark.title}
                          </a>
                          <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-500 leading-tight">
                          <div className="flex items-center gap-1">
                            <Folder className="w-3 h-3 opacity-70" />
                            <span>{bookmark.folder}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 opacity-70" />
                            <span>
                              {bookmark.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {bookmark.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 border border-dotted border-gray-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingBookmark(bookmark);
                            setTitle(bookmark.title);
                            setUrl(bookmark.url);
                            setFolder(bookmark.folder);
                            setRemindAt(bookmark.remindAt);
                            setTags(bookmark.tags);
                            setNotes(bookmark.notes || "");
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newArchived = !bookmark.isArchived;
                            setBookmarks(
                              bookmarks.map((bm) =>
                                bm.id === bookmark.id
                                  ? { ...bm, isArchived: newArchived }
                                  : bm
                              )
                            );
                            lastAction.current = () => {
                              setBookmarks(
                                bookmarks.map((bm) =>
                                  bm.id === bookmark.id
                                    ? { ...bm, isArchived: bookmark.isArchived }
                                    : bm
                                )
                              );
                            };
                            toast(newArchived ? "Archived" : "Unarchived", {
                              action: {
                                label: "Undo",
                                onClick: () => {
                                  lastAction.current?.();
                                  lastAction.current = null;
                                },
                              },
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteBookmark(bookmark)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CommandMenu
            open={cmdOpen}
            setOpen={setCmdOpen}
            bookmarks={bookmarks}
            folders={folders.map((f) => f.name)}
            tags={globalTags}
            onSelectBookmark={(bm: Bookmark) => {
              setEditingBookmark(bm);
              setTitle(bm.title);
              setUrl(bm.url);
              setFolder(bm.folder);
              setRemindAt(bm.remindAt);
              setTags(bm.tags);
              setNotes(bm.notes || "");
              setModalOpen(true);
            }}
            onFilterFolder={(folder: string) => {
              setSearchQuery("");
              setSelectedTag(null);
              setFolder(folder);
            }}
            onFilterTag={(tag: string) => {
              setSearchQuery("");
              setSelectedTag(tag);
            }}
          />
          <Toaster
            position="bottom-center"
            theme="light"
            visibleToasts={1}
            gap={14}
            toastOptions={{
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontSize: "0.8rem",
                width: "80%",
              },
            }}
          />
        </div>
      </main>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingBookmark(null);
            setTitle("");
            setUrl("");
            setFolder("General");
            setRemindAt(undefined);
            setTags([]);
            setTagInput("");
            setNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBookmark ? "Edit Bookmark" : "Save Bookmark"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="title">Name</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="url">URL</label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="folder">Folder</label>
              <Select
                value={folder}
                onValueChange={(v: string) => {
                  if (v === "__add") {
                    addFolder();
                  } else {
                    setFolder(v);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__add">
                    <PlusIcon className="mr-2 inline" /> Add folder ...
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="tags">Tags</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        Select of create tags...
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search tags..."
                      value={tagInput}
                      onValueChange={setTagInput}
                    />

                    <CommandList>
                      {globalTags.length === 0 && (
                        <CommandEmpty>No Tags Found.</CommandEmpty>
                      )}
                      {globalTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => {
                            if (tags.includes(tag)) {
                              setTags(tags.filter((t) => t !== tag));
                            } else {
                              setTags([...tags, tag]);
                            }
                          }}
                          className="flex justify-between"
                        >
                          <span>#{tag}</span>
                          {tags.includes(tag) && <Check className="h-4 w-4" />}
                        </CommandItem>
                      ))}
                      {tagInput.trim().length > 0 &&
                        !globalTags.includes(tagInput.trim()) && (
                          <CommandItem
                            onSelect={() => {
                              const trimmed = tagInput.trim();
                              if (trimmed) {
                                setTags([...tags, trimmed]);
                                if (!globalTags.includes(trimmed)) {
                                  setGlobalTags([...globalTags, trimmed]);
                                }
                                setTagInput("");
                              }
                            }}
                          >
                            + Add &quot;{tagInput.trim()}&quot;
                          </CommandItem>
                        )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBookmark}>
              {editingBookmark ? "Save Changed" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={folderModalOpen} onOpenChange={setFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Folder</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <label htmlFor="folderName">Folder Name</label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Reading List"
            />
          </div>
          <div>
            <label>Icon</label>
            <IconPicker
              value={newFolderIcon as IconName}
              onValueChange={setNewFolderIcon}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newFolderName) return;
                if (folders.some((f) => f.name === newFolderName)) {
                  toast("Folder name already exists");
                  return;
                }
                setFolders([
                  ...folders,
                  { name: newFolderName, icon: newFolderIcon },
                ]);
                setFolder(newFolderName);
                setNewFolderName("");
                setNewFolderIcon("folder");
                setFolderModalOpen(false);
              }}
            >
              Add Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
