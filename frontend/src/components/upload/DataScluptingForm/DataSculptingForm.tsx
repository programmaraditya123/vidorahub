"use client";

import { useState, useCallback, useRef } from "react";
import styles from "./DataSculptingForm.module.scss";

interface Props {
  onPublish?: (data: { title: string; description: string; tags: string[] }) => void;
}

export default function DataSculptingForm({ onPublish }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>(["trending"]);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const cleaned = newTag.trim().replace(/\s+/g, "");
    if (cleaned && !tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setAdding(false);
    setNewTag("");
  }, [newTag, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); addTag(); }
      if (e.key === "Escape") { setAdding(false); setNewTag(""); }
    },
    [addTag]
  );

  const handlePublish = useCallback(async () => {
    if (!title.trim()) { setTitleError(true); return; }
    setTitleError(false);
    setLoading(true);
    try {
      await onPublish?.({ title: title.trim(), description: description.trim(), tags });
    } finally {
      setLoading(false);
    }
  }, [title, description, tags, onPublish]);

  const openTagInput = useCallback(() => {
    setAdding(true);
    // focus after state flush
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>
        <span className="material-symbols-outlined">draw</span>
        Data Sculpting
      </h2>

      <div className={`${styles.formGroup} ${titleError ? styles.hasError : ""}`}>
        <label htmlFor="ds-title">Title</label>
        <input
          id="ds-title"
          className={styles.input}
          placeholder="Enter video title…"
          value={title}
          maxLength={120}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError && e.target.value.trim()) setTitleError(false);
          }}
        />
        {titleError && <span className={styles.errorMsg}>Title is required</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="ds-desc">Description</label>
        <textarea
          id="ds-desc"
          className={styles.textarea}
          placeholder="Describe the video…"
          value={description}
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className={styles.charCount}>{description.length}/2000</span>
      </div>

      <div className={styles.tagsWrapper}>
        <label>Cloud Tagging</label>
        <div className={styles.tagsBox}>
          {tags.map((tag) => (
            <div key={tag} className={styles.tag}>
              #{tag}
              <button
                className={styles.tagRemove}
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}

          {adding ? (
            <input
              ref={tagInputRef}
              className={styles.tagInput}
              value={newTag}
              maxLength={30}
              onChange={(e) => setNewTag(e.target.value)}
              onBlur={addTag}
              onKeyDown={handleTagKeyDown}
              placeholder="Tag name…"
            />
          ) : (
            <button className={styles.tagAdd} onClick={openTagInput}>
              + Add Bubble
            </button>
          )}
        </div>
      </div>

      <div className={styles.buttonsRow}>
        <button
          className={styles.btnPublish}
          onClick={handlePublish}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className={styles.spinner} />
              Publishing…
            </>
          ) : (
            <>
              PUBLISH VIDEO
              <span className="material-symbols-outlined">rocket_launch</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}