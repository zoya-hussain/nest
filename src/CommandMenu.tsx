"use client";

import * as React from "react";
import { Command } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark } from "@/types";
import { 
  Search, 
  Bookmark as BookmarkIcon, 
  Folder, 
  Tag, 
  ExternalLink,
  Plus,
  ChevronRight
} from "lucide-react";

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
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.url.toLowerCase().includes(search.toLowerCase()) ||
    b.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 2); 

  const filteredFolders = folders.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 2); 

  const quickActions = [
    {
      id: 'new-bookmark',
      label: 'Add new bookmark',
      icon: Plus,
      action: () => {
        setOpen(false);
      }
    }
  ];

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden bg-white border border-dotted border-gray-300 rounded-none shadow-lg w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Command Menu</DialogTitle>
        </DialogHeader>

        <Command className="w-full font-mono">
          <div className="relative border-b border-dotted border-gray-200">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search bookmarks, folders, and tags"
              className="w-full pl-10 pr-4 py-3 text-sm font-mono bg-transparent outline-none border-none placeholder:text-gray-400"
            />
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto">
            <Command.Empty className="p-4 text-center">
              <div className="text-gray-400 text-sm font-mono">
                No results found for &quot;{search}&quot;
              </div>
              <div className="text-xs text-gray-300 mt-0.5">
                Try searching for bookmarks, folders, or tags
              </div>
            </Command.Empty>

            {search === "" && (
              <Command.Group>
                <div className="px-3 py-1.5 text-xs font-mono text-gray-500 bg-gray-50 border-b border-dotted border-gray-200">
                  QUICK ACTIONS
                </div>
                {quickActions.map((action) => (
                  <Command.Item
                    key={action.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-mono cursor-pointer hover:bg-gray-50 border-b border-dotted border-gray-100 transition-colors group"
                    onSelect={action.action}
                  >
                    <action.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                    <span className="flex-1 text-gray-700 group-hover:text-gray-900">
                      {action.label}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {filteredBookmarks.length > 0 && (
              <Command.Group>
                <div className="px-3 py-1.5 text-xs font-mono text-gray-500 bg-gray-50 border-b border-dotted border-gray-200 flex items-center gap-1.5">
                  <BookmarkIcon className="w-3 h-3" />
                  RECENT BOOKMARKS ({filteredBookmarks.length})
                </div>
                {filteredBookmarks.map((bm) => (
                  <Command.Item
                    key={bm.id}
                    className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-gray-50 border-b border-dotted border-gray-100 transition-colors group"
                    onSelect={() => {
                      onSelectBookmark(bm);
                      setOpen(false);
                    }}
                  >
                    <BookmarkIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono text-gray-900 group-hover:text-blue-600 truncate leading-tight">
                        {bm.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Edit</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {filteredFolders.length > 0 && (
              <Command.Group>
                <div className="px-3 py-1.5 text-xs font-mono text-gray-500 bg-gray-50 border-b border-dotted border-gray-200 flex items-center gap-1.5">
                  <Folder className="w-3 h-3" />
                  FOLDERS ({filteredFolders.length})
                </div>
                {filteredFolders.map((f) => (
                  <Command.Item
                    key={f}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-mono cursor-pointer hover:bg-gray-50 border-b border-dotted border-gray-100 transition-colors group"
                    onSelect={() => {
                      onFilterFolder(f);
                      setOpen(false);
                    }}
                  >
                    <Folder className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                    <span className="flex-1 text-gray-700 group-hover:text-gray-900">
                      {f}
                    </span>
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Filter
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {filteredTags.length > 0 && (
              <Command.Group>
                <div className="px-3 py-1.5 text-xs font-mono text-gray-500 bg-gray-50 border-b border-dotted border-gray-200 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  TAGS ({filteredTags.length})
                </div>
                <div className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {filteredTags.map((tag) => (
                      <Command.Item
                        key={tag}
                        className="px-1.5 py-1 text-xs font-mono border border-dotted border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition-colors rounded-none"
                        onSelect={() => {
                          onFilterTag(tag);
                          setOpen(false);
                        }}
                      >
                        #{tag}
                      </Command.Item>
                    ))}
                  </div>
                </div>
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-dotted border-gray-200 px-3 py-1.5 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-dotted border-gray-300 rounded-none text-xs">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-dotted border-gray-300 rounded-none text-xs">↑↓</kbd>
                  <span>Navigate</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-dotted border-gray-300 rounded-none text-xs">ESC</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}