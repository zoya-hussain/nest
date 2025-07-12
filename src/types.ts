export type Bookmark = {
  id: string;
  title: string;
  url: string;
  folder: string;
  remindAt: Date;
  createdAt: Date;
  tags: string[];
  isArchived?: boolean;
}; 