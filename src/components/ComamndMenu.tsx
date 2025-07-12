"use client";

import * as React from "react";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

type CommandMenuProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  bookmarks: Bookmark[];
  folders: string[];
  tags: string[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onFilterFolder: (folder: string) => void;
  onFilterTag: (tag: string) => void;
};

export default function CommandMenu({
  open,
  setOpen,
  bookmarks,
  folders,
  tags,
  onSelectBookmark,
  onFilterFolder,
  onFilterTag,
}: CommandMenuProps) {
  const [search, setSearch] = React.useState("");

  const filteredBookmarks = bookmarks.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFolders = folders.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 overflow-hidden bg-white rounded-xl shadow-2xl w-full max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Command Menu</DialogTitle>
        </DialogHeader>

        <Command className="w-full">
          <Command.Input
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder="Search bookmarks, folders, tags..."
            className="w-full border-b p-4 outline-none"
          />
          <Command.List className="max-h-[300px] overflow-y-auto">
            <Command.Empty className="p-4 text-sm text-gray-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Bookmarks">
              {filteredBookmarks.map((bm) => (
                <Command.Item
                  key={bm.id}
                  className="p-4 cursor-pointer hover:bg-gray-100"
                  onSelect={() => {
                    onSelectBookmark(bm);
                    setOpen(false);
                  }}
                >
                  🔖 {bm.title}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Folders">
              {filteredFolders.map((f) => (
                <Command.Item
                  key={f}
                  className="p-4 cursor-pointer hover:bg-gray-100"
                  onSelect={() => {
                    onFilterFolder(f);
                    setOpen(false);
                  }}
                >
                  📂 {f}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Tags">
              {filteredTags.map((tag) => (
                <Command.Item
                  key={tag}
                  className="p-4 cursor-pointer hover:bg-gray-100"
                  onSelect={() => {
                    onFilterTag(tag);
                    setOpen(false);
                  }}
                >
                  🏷️ #{tag}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
