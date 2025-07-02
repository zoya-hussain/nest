'use client'
import { useState } from 'react'

type Bookmark = {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

export default function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  
  const deleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id))
  }

  const addBookmark = () => {
    if (!title || !url) return
    
    const newBookmark = {
      id: Date.now().toString(),
      title: title,
      url: url,
      createdAt: new Date()
    }
    setBookmarks([newBookmark, ...bookmarks])
    setTitle('')
    setUrl('')
  }
  
  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-2xl font-bold text-black mb-8">Bookmarks</h1>
      
      <div className="border border-black p-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Add Bookmark</h2>
        
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 mb-2"
        />
        
        <input
          type="text"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border border-gray-300 mb-2"
        />
        <button 
          onClick={addBookmark}
          className="bg-black text-white px-4 py-2"
        >
          Add Bookmark
        </button>
      </div>

      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="border border-gray-300 p-4">
            <h3 className="font-semibold text-lg">{bookmark.title}</h3>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {bookmark.url}
            </a>
            <p className="text-sm text-gray-500 mt-2">
              Added: {bookmark.createdAt.toLocaleDateString()}
            </p>
            <button 
              onClick={() => deleteBookmark(bookmark.id)}
              className="bg-red-500 text-white px-3 py-1 h-fit mt-2"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <p>You have {bookmarks.length} bookmarks</p>
    </div>
  )
}