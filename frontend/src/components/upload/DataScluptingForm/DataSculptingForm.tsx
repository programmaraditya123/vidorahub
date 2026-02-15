"use client";

import { useState } from "react";
import styles from "./DataSculptingForm.module.scss";

interface Props {
  onPublish?: (data: {
    title: string;
    description: string;
    tags: string[];
  }) => void;
  onSaveDraft?: () => void;
}

export default function DataSculptingForm({
  onPublish,
  onSaveDraft
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>(["trending"]);
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [loading,isLoading] = useState(false)

  const addTag = () => {
    const cleaned = newTag.trim().replace(/\s+/g, "");

    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }

    setAdding(false);
    setNewTag("");
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>
        <span className="material-symbols-outlined text-primary">draw</span>
        Data Sculpting
      </h2>

      <div className={styles.formGroup}>
        <label>Title</label>
        <input
          className={styles.input}
          placeholder="Enter video title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea
          className={styles.textarea}
          placeholder="Describe the video..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.tagsWrapper}>
        <label>Cloud Tagging</label>

        <div className={styles.tagsBox}>
          {tags.map((tag) => (
            <div key={tag} className={styles.tag}>
              #{tag}
              <span className="material-symbols-outlined" onClick={() => setTags(tags.filter(t => t !== tag))}>
                close
              </span>
            </div>
          ))}

          {adding ? (
            <input
              className={styles.tagInput}
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onBlur={addTag}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTag();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Tag name..."
            />
          ) : (
            <div className={styles.tagAdd} onClick={() => setAdding(true)}>
              + Add Bubble
            </div>
          )}
        </div>
      </div>

      <div className={styles.buttonsRow}>
        <button onClick={onSaveDraft} className={styles.btnDraft}>
          SAVE DRAFT
        </button>

        <button
          onClick={() => onPublish?.({ title, description, tags })}
          className={styles.btnPublish}
        >
          PUBLISH Video
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>
    </div>
  );
}