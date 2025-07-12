"use client";

import * as React from "react";
import { Command } from "cmdk";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"

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
    <Command.Dialog
      className="bg-white rounded-md shadow-lg p-4 w-[500px] max-w-full mx-auto mt-20"
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
    >
    <DialogTitle>erm title lolz</DialogTitle>

      <Command.Input
        className="border-b w-full p-2 mb-2"
        placeholder="Search bookmarks, tags, folders ..."
      />
      <Command.List className="max-h-[300px] overflow-y-auto">
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Bookmarks">
          {bookmarks.map((bm) => (
            <Command.Item
              className="p-2 hover:bg-gray-100 cursor-pointer"
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
              className="p-2 hover:bg-gray-100 cursor-pointer"
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
              className="p-2 hover:bg-gray-100 cursor-pointer"
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
