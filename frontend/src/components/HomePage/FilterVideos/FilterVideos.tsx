"use client";

import useUserCredential from "@/src/hooks/ui/Shared/useUserCredential";
import { sendCategorySelectEvent } from "@/src/lib/userEvents/userEvents";
import styles from "./FilterVideos.module.scss";

const topics = [
  "All",
  "Music",
  "Bhajan",
  "Spiritual",
  "Wrestling",
  "Software",
  "Gaming",
  "Food Vlogs", 
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
  "meme"
];

type FilterVideosProps = {
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
};

const FilterVideos = ({ selectedTopic, onTopicChange }: FilterVideosProps) => {
  const credentials = useUserCredential();

  const handleTopicChange = (topic: string) => {
    onTopicChange(topic);

    if (!credentials.isInitialized) {
      return;
    }

    const storedCredentials = credentials.getCredentials();
    const eventId =
      credentials.generateEventId() ?? storedCredentials.eventId;

    if (!eventId || !storedCredentials.deviceId) {
      return;
    }

    sendCategorySelectEvent({
      eventId,
      categorySelected: topic,
      deviceId: storedCredentials.deviceId,
      userId: localStorage.getItem("userId") || null,
      profileId: localStorage.getItem("activeProfileId") || null,
      sessionId: storedCredentials.sessionId,
    }).catch((error) => {
      console.error("Failed to send category select event:", error);
    });
  };

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
              onClick={() => handleTopicChange(topic)}
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
