"use client";

import { useState } from "react";

import styles from "./FilterVideos.module.scss";

const topics = [
  "All",
  "Music",
  "Bhajan",
  "Wrestling",
  "Software",
  "Gaming",
  "Comedy",
  "Movies",
  "Education",
  "News",
  "Sports",
  "Tech",
  "Podcasts",
  "Live",
  "Cooking",
  "Travel",
  "Fashion",
  "Fitness",
];

const FilterVideos = () => {
  const [selectedTopic, setSelectedTopic] = useState("All");

  return (
    <nav className={styles.filterBar} aria-label="Video filters">
      <div className={styles.scroller} role="list">
        {topics.map((topic) => {
          const isSelected = selectedTopic === topic;

          return (
            <button
              key={topic}
              type="button"
              className={`${styles.pill} ${isSelected ? styles.selected : ""}`}
              aria-pressed={isSelected}
              onClick={() => setSelectedTopic(topic)}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default FilterVideos;
