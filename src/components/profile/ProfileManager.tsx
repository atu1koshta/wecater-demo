"use client";

import { useCallback, useMemo, useState } from "react";
import type { Profile, ProfileNote } from "@/types";
import { DEFAULT_PROFILE_ID, PROFILES } from "@/data/profiles";
import {
  ProfileList,
  type ListFilter,
  type ListSort,
} from "./ProfileList";
import { ProfileDetail } from "./ProfileDetail";
import { ProfileSidekick } from "./ProfileSidekick";

export function ProfileManager() {
  const [profiles, setProfiles] = useState<Profile[]>(PROFILES);
  const [activeId, setActiveId] = useState<string>(DEFAULT_PROFILE_ID);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [sort, setSort] = useState<ListSort>("recent");

  const active = useMemo(
    () => profiles.find((p) => p.id === activeId),
    [profiles, activeId],
  );

  const visible = useMemo(() => {
    let list = profiles.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (filter === "compliance_warning") {
      list = list.filter((p) => p.flags.includes("compliance_warning"));
    } else if (filter === "active") {
      list = list.filter(
        (p) =>
          p.flags.includes("active_relationship") ||
          p.flags.includes("high_volume"),
      );
    } else if (filter === "incomplete") {
      list = list.filter(
        (p) =>
          p.flags.includes("incomplete_profile") ||
          p.flags.includes("new_relationship"),
      );
    }
    if (sort === "alphabetical") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "headcount") {
      list = [...list].sort((a, b) => b.headcount - a.headcount);
    }
    return list;
  }, [profiles, search, filter, sort]);

  const addNote = useCallback(
    (note: ProfileNote) => {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === activeId ? { ...p, notes: [note, ...p.notes] } : p,
        ),
      );
    },
    [activeId],
  );

  if (!active) return null;

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100dvh-3.5rem)]">
      <ProfileList
        profiles={visible}
        activeId={activeId}
        search={search}
        filter={filter}
        sort={sort}
        onSelect={setActiveId}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onSortChange={setSort}
      />
      <ProfileDetail profile={active} onAddNote={addNote} />
      <ProfileSidekick profile={active} />
    </div>
  );
}
