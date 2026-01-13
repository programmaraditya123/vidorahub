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

export default function DataSculptingForm({ onPublish, onSaveDraft }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([
    "Cinematic",
    "MotionGraphics",
    "VFX",
  ]);

  const addTag = () => {
    const next = prompt("Enter new tag:");
    if (!next) return;
    setTags([...tags, next]);
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const onPublishClick = () => {
    onPublish?.({
      title,
      description,
      tags,
    });
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>
        <span className="material-symbols-outlined text-primary">draw</span>
        Data Sculpting
      </h2>

      {/* Title */}
      <div className={styles.formGroup}>
        <label>Sculpt Your Title</label>
        <input
          className={styles.input}
          placeholder="Enter video title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label>Vision Statement</label>
        <textarea
          className={styles.textarea}
          placeholder="Describe your vision in the glass..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Cloud Tags */}
      <div className={styles.tagsWrapper}>
        <label>Cloud Tagging</label>

        <div className={styles.tagsBox}>
          {tags.map((tag) => (
            <div key={tag} className={styles.tag}>
              #{tag}
              <span
                className="material-symbols-outlined"
                onClick={() => removeTag(tag)}
              >
                close
              </span>
            </div>
          ))}

          <div className={styles.tagAdd} onClick={addTag}>
            + Add Bubble
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className={styles.resourcesWrapper}>
        <h3>Resources & Vault</h3>

        <div className={styles.resourcesRow}>
          <div className={styles.resource}>
            <span className="material-symbols-outlined text-primary text-sm">
              description
            </span>
            <span>project_spec.pdf</span>
          </div>

          <div className={styles.resource}>
            <span className="material-symbols-outlined text-blue-400 text-sm">
              audio_file
            </span>
            <span>bg_score.wav</span>
          </div>

          <button className={styles.resourceAdd}>
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.buttonsRow}>
        <button onClick={onSaveDraft} className={styles.btnDraft}>
          SAVE DRAFT
        </button>

        <button onClick={onPublishClick} className={styles.btnPublish}>
          PUBLISH KINETIC
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </div>
    </div>
  );
}
