"use client";

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

type FilterVideosProps = {
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
};

const FilterVideos = ({ selectedTopic, onTopicChange }: FilterVideosProps) => {
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
              onClick={() => onTopicChange(topic)}
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
