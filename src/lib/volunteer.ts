/** Volunteer contribution areas and options — shared by the page and form. */

export const contributionAreas = [
  {
    id: "content-social",
    name: "Content & Social Media",
    description:
      "Video editing, graphic design, writing, reels, and running the movement's social handles.",
    icon: "clapperboard",
  },
  {
    id: "outreach-community",
    name: "Outreach & Community",
    description:
      "On-ground awareness, campus coordination, welcoming new members, and moderating the community.",
    icon: "megaphone",
  },
  {
    id: "mentorship-teaching",
    name: "Mentorship & Teaching",
    description:
      "Teaching free courses and classes, sharing study strategies, and guiding aspirants one-on-one.",
    icon: "graduation-cap",
  },
  {
    id: "counselling-mental-health",
    name: "Counselling & Mental Health",
    description:
      "Running counselling sessions, peer emotional support, and helping members through exam stress.",
    icon: "heart-handshake",
  },
  {
    id: "professional-skills",
    name: "Professional Skills",
    description:
      "Legal aid, web & tech, data and research, fundraising, and other specialised expertise.",
    icon: "briefcase",
  },
  {
    id: "events-campaigns",
    name: "Events & Campaigns",
    description:
      "Organising meetups, running campaigns and petitions, and documenting student issues.",
    icon: "calendar-days",
  },
] as const;

export const areaIds = contributionAreas.map((a) => a.id);

export const availabilityOptions = [
  "A few hours a week",
  "Weekends only",
  "Flexible — whenever needed",
  "Full-time commitment",
] as const;
