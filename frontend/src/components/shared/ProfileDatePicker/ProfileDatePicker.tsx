"use client";

import { useEffect, useState } from "react";
import styles from "./ProfileDatePicker.module.scss";

type ProfileDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  label?: string;
  tone?: "light" | "dark";
};

function pad(value: string) {
  return value.padStart(2, "0");
}

function parseDateValue(value: string) {
  if (!value) return { day: "", month: "", year: "" };

  const [year = "", month = "", day = ""] = value.split("-");
  return { day, month, year };
}

function isValidDate(day: string, month: string, year: string) {
  if (day.length < 1 || month.length < 1 || year.length !== 4) return false;

  const normalizedDay = Number(day);
  const normalizedMonth = Number(month);
  const normalizedYear = Number(year);
  const date = new Date(normalizedYear, normalizedMonth - 1, normalizedDay);

  return (
    normalizedYear >= 1900 &&
    normalizedMonth >= 1 &&
    normalizedMonth <= 12 &&
    normalizedDay >= 1 &&
    date.getFullYear() === normalizedYear &&
    date.getMonth() === normalizedMonth - 1 &&
    date.getDate() === normalizedDay
  );
}

function toDateValue(day: string, month: string, year: string) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function cleanNumber(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export default function ProfileDatePicker({
  value,
  onChange,
  max,
  label = "Date of birth",
  tone = "light",
}: ProfileDatePickerProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    const parsed = parseDateValue(value);
    setDay(parsed.day);
    setMonth(parsed.month);
    setYear(parsed.year);
  }, [value]);

  const commitDate = (nextDay: string, nextMonth: string, nextYear: string) => {
    if (!nextDay && !nextMonth && !nextYear) {
      onChange("");
      return;
    }

    if (!isValidDate(nextDay, nextMonth, nextYear)) {
      return;
    }

    const nextValue = toDateValue(nextDay, nextMonth, nextYear);
    if (max && nextValue > max) return;

    onChange(nextValue);
  };

  const handleDayChange = (nextValue: string) => {
    const nextDay = cleanNumber(nextValue, 2);
    setDay(nextDay);
    commitDate(nextDay, month, year);
  };

  const handleMonthChange = (nextValue: string) => {
    const nextMonth = cleanNumber(nextValue, 2);
    setMonth(nextMonth);
    commitDate(day, nextMonth, year);
  };

  const handleYearChange = (nextValue: string) => {
    const nextYear = cleanNumber(nextValue, 4);
    setYear(nextYear);
    commitDate(day, month, nextYear);
  };

  return (
    <div className={`${styles.field} ${tone === "dark" ? styles.dark : ""}`}>
      <span className={styles.label}>{label}</span>
      <div className={styles.segmentGroup}>
        <input
          inputMode="numeric"
          value={day}
          maxLength={2}
          onChange={(event) => handleDayChange(event.target.value)}
          placeholder="DD"
          aria-label="Day"
        />
        <input
          inputMode="numeric"
          value={month}
          maxLength={2}
          onChange={(event) => handleMonthChange(event.target.value)}
          placeholder="MM"
          aria-label="Month"
        />
        <input
          inputMode="numeric"
          value={year}
          maxLength={4}
          onChange={(event) => handleYearChange(event.target.value)}
          placeholder="YYYY"
          aria-label="Year"
        />
      </div>
    </div>
  );
}
