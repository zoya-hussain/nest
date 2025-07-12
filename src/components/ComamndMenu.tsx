"use client";

import * as React from "react";
import { Command } from "cmdk";

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

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command Menu">
      <Command.Input placeholder="Search bookmarks, tags, folders ..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Bookmarks">
          {bookmarks.map((bm) => (
            <Command.Item
              key={bm.id}
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
          {folders.map((f) => (
            <Command.Item
              key={f}
              onSelect={() => {
                onFilterFolder(f);
                setOpen(false);
              }}
            >
              📂 {f}{" "}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Tags">
          {tags.map((tag) => (
            <Command.Item
              key={tag}
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
    </Command.Dialog>
  );
}
