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
import { CalendarIcon, PlusIcon, Trash2Icon, Check } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { v4 as uuid } from "uuid";
import { Toaster, toast } from "sonner";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

function toPascalCase(str: string) {
  return str
    .replace(/[-_]+/g, " ")
    .replace(/\s+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/\s/g, "")
    .replace(/^(.)/, (_, chr) => chr.toUpperCase());
}

function Icon({ name, ...props }: { name: string; className?: string }) {
  const safeName = toPascalCase(name);

  console.log(`Trying to render icon: "${safeName}"`);

  const IconComponent = (Icons as any)[safeName];

  if (!IconComponent) {
    console.warn(`Icon "${safeName}" not found, falling back to Folder.`);
    return <Icons.Folder {...props} />;
  }

  return <IconComponent {...props} />;
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
  const lastAction = useRef<any>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const exportFolder = () => {
    const folderBookmarks = bookmarks.filter(
      (b) => b.folder === folder && !b.isArchived
    );

    if (folderBookmarks.length === 0) {
      toast("No bookmarks in this folder to export.");
      return;
    }
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${folder} - Exported Bookmarks</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    h1 { font-size: 1.5rem; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 0.75rem; }
    a { color: #0070f3; text-decoration: none; }
    a:hover { text-decoration: underline; }
    p { color: #555; margin: 0.25rem 0; }
    small { color: #999; }
  </style>
</head>
<body>
  <h1>Folder: ${folder}</h1>
  <ul>
    ${folderBookmarks
      .map(
        (b) => `
      <li>
        <a href="${b.url}" target="_blank">${b.title}</a><br/>
        <p>${b.url}</p>
        ${b.notes ? `<p><em>${b.notes}</em></p>` : ""}
        ${
          b.tags.length
            ? `<p>Tags: ${b.tags.map((t) => `#${t}`).join(", ")}</p>`
            : ""
        }
      </li>
    `
      )
      .join("")}
  </ul>
</body>
</html>
`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${folder.replace(/\s+/g, "_")}_bookmarks.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        remindAt: new Date(b.remindAt),
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
    if (!title || !url || !remindAt) return;

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
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white border-r p-6 flex flex-col ">
        <h1 className="text-s font-bold mb-8">Bookmarks</h1>

        <div className="flex-1 space-y-2">
          {folders.map((f) => (
            <Button
              key={f.name}
              variant={folder === f.name ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setSearchQuery("");
                setSelectedTag(null);
                setFolder(f.name);
              }}
            >
              <Icon name={f.icon} className="h-4 w-4" />
              {f.name}
            </Button>
          ))}
        </div>

        <Button
          onClick={() => setFolderModalOpen(true)}
          variant="outline"
          className="w-full mt-6"
        >
          New Folder
        </Button>

        <Button
          onClick={exportFolder}
          variant="outline"
          className="w-full mt-2"
        >
          Export Folder
        </Button>
      </aside>

      <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
        {" "}
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div className="flex flex-1 gap-4">
            <Input
              ref={searchRef}
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedTag(null);
              }}
            />
          </div>
          <Button onClick={() => setModalOpen(true)}>+ New Bookmark</Button>
        </div>
        {searchQuery === "" && globalTags.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              onClick={() => setSelectedTag(null)}
            >
              All Tags
            </Button>
            {globalTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                onClick={() => setSelectedTag(tag)}
              >
                #{tag}
              </Button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Newest</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
        </div>
        <div className="space-y-4">
          {visibleBookmarks.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border p-6 flex justify-between items-start hover:shadow transition"
            >
              <div>
                <a
                  href={b.url}
                  target="_blank"
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {b.title}
                </a>
                <p className="text-sm text-gray-500">{b.url}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Folder: {b.folder} • Added: {b.createdAt.toLocaleDateString()}{" "}
                  • Remind: {b.remindAt.toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {b.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                {b.notes && (
                  <p className="text-sm text-gray-600 mt-2 italic">{b.notes}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const newArchived = !b.isArchived;
                    setBookmarks(
                      bookmarks.map((bm) =>
                        bm.id === b.id ? { ...bm, isArchived: newArchived } : bm
                      )
                    );
                    lastAction.current = () => {
                      setBookmarks(
                        bookmarks.map((bm) =>
                          bm.id === b.id
                            ? { ...bm, isArchived: b.isArchived }
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
                >
                  {b.isArchived ? "Unarchive" : "Archive"}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingBookmark(b);
                    setTitle(b.title);
                    setUrl(b.url);
                    setFolder(b.folder);
                    setRemindAt(b.remindAt);
                    setTags(b.tags);
                    setNotes(b.notes || "");
                    setModalOpen(true);
                  }}
                >
                  ↳
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteBookmark(b)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
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
        <Toaster position="top-right" />
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
              <label htmlFor="remind">Remind me on</label>
              <div className="flex items-center space-x-2">
                <CalendarIcon />
                <DatePicker date={remindAt} setDate={setRemindAt} />
              </div>
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
                            + Add "{tagInput.trim()}"
                          </CommandItem>
                        )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Add any notes about this bookmark..."
              />
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
