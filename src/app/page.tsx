"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { v4 as uuid } from "uuid";
import { Toaster, toast } from "sonner";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  folder: string;
  remindAt: Date;
  createdAt: Date;
  tags: string[];
  isArchived?: boolean;
};

export default function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [folder, setFolder] = useState("General");
  const [folders, setFolders] = useState(["General"]);
  const [remindAt, setRemindAt] = useState<Date | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const lastAction = useRef<any>(null);

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
    const saved = localStorage.getItem("bookmarks");
    if (saved)
      setBookmarks(
        JSON.parse(saved).map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
          remindAt: new Date(b.remindAt),
        }))
      );
  }, []);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const saveBookmark = () => {
    if (!title || !url || !remindAt) return;

    if (editingBookmark) {
      const updated = bookmarks.map((b) =>
        b.id === editingBookmark.id
          ? { ...b, title, url, folder, remindAt, tags }
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
      };
      setBookmarks([newBm, ...bookmarks]);
    }

    setTitle("");
    setUrl("");
    setRemindAt(undefined);
    setTags([]);
    setTagInput("");
    setModalOpen(false);
  };

  const addFolder = () => {
    const name = prompt("New folder name");
    if (name && !folders.includes(name)) {
      setFolders([...folders, name]);
      setFolder(name);
    }
  };

  const undoLastAction = () => {
    const action = lastAction.current;
    if (!action) return;

    if (action.type === "delete") {
      setBookmarks((prev) => [action.bookmark, ...prev]);
    } else if (action.type === "archive") {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === action.bookmark.id
            ? { ...b, isArchived: action.oldArchived }
            : b
        )
      );
    }
    toast.success("Undone!");
    lastAction.current = null;
  };

  const deleteBookmark = (bm: Bookmark) => {
    lastAction.current = { type: "delete", bookmark: bm };
    setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));

    toast("Bookmark deleted", {
      action: {
        label: "Undo",
        onClick: () => undoLastAction(),
      },
    });
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
      : bookmarks
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

  return (
    <div className="min-h-screen bg-white p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>

      <Input
        type="text"
        placeholder="Search bookmarks..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSelectedTag(null);
        }}
        className="mb-4 max-w-md"
      />

      {searchQuery === "" && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={selectedTag === null ? "default" : "outline"}
            onClick={() => setSelectedTag(null)}
          >
            All Tags
          </Button>
          {[...new Set(bookmarks.flatMap((b) => b.tags))].map((tag) => (
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

      <Select
        value={sortOrder}
        onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}
      >
        <SelectTrigger className="w-[200px] mb-4">
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
        className="ml-4"
      >
        {showArchived ? "Show Active" : "Show Archived"}
      </Button>

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
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBookmark ? "Edit Bookmark" : "Save Bookmar"}
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
                    <SelectItem key={f} value={f}>
                      {" "}
                      {f}
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
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = tagInput.trim();
                    if (trimmed && !tags.includes(trimmed)) {
                      setTags((prev) => [...prev, trimmed]);
                    }
                    setTagInput("");
                  }
                }}
                placeholder="Press Enter to add"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full cursor-pointer"
                  >
                    {tag} ✕
                  </span>
                ))}
              </div>
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

      <div className="space-y-4 mt-8">
        {visibleBookmarks.map((b) => (
          <div key={b.id} className="border p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <a
                  href={b.url}
                  target="_blank"
                  className="text-lg font-semibold text-blue-600 underline"
                >
                  {b.title}
                </a>
                <p className="text-sm text-gray-500">{b.url}</p>
                <p className="text-xs text-gray-400">
                  Folder: {b.folder} • Added: {b.createdAt.toLocaleDateString()}{" "}
                  • Remind: {b.remindAt.toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {b.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const newArchived = !(b.isArchived ?? false);
                  lastAction.current = {
                    type: "archive",
                    bookmark: b,
                    oldArchived: b.isArchived ?? false,
                  };

                  setBookmarks((prev) =>
                    prev.map((bm) =>
                      bm.id === bm.id ? { ...bm, isArchived: newArchived } : bm
                    )
                  );

                  toast(`Bookmark ${newArchived ? "archived" : "unarchived"}`, {
                    action: {
                      label: "Undo",
                      onClick: () => undoLastAction(),
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

      <p className="mt-4 text-gray-600">
        Showing {visibleBookmarks.length} bookmark
        {visibleBookmarks.length !== 1 && "s"}
      </p>
    </div>
  );
}
