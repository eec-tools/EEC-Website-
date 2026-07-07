import React, { useState, useCallback } from "react";
import "./TeamSection.css";
import { IMAGE_DIMENSIONS } from "@/constants/imageDimensions";

const TEAM = [
  {
    id: "shirali-shetty",
    name: "Shirali Shetty",
    role: "Founder & CEO",
    image: "/images/team/shirali-shetty.png",
    mt: 80,
  },
  {
    id: "mohita-vadrevu",
    name: "Mohita Vadrevu",
    role: "Strategic Partnerships Lead",
    image: "/images/team/mohita-vadrevu.png",
    mt: 280,
  },
  {
    id: "madan-maskara",
    name: "Madan Maskara",
    role: "Tech & CRM Lead",
    image: "/images/team/madan-maskara.png",
    mt: 160,
  },
  {
    id: "vandana-ahire",
    name: "Vandana Ahire",
    role: "Global Procurement Strategist",
    image: "/images/team/vandana-ahire.png",
    mt: 290,
  },
  {
    id: "shovan-karmakar",
    name: "Shovan Karmakar",
    role: "Supplier Acquisition Specialist",
    image: "/images/team/shovan-karmakar.png",
    mt: 170,
  },
];

export default function TeamSection() {
  const [activeId, setActiveId] = useState(null);

  const activate = useCallback((id) => setActiveId(id), []);
  const deactivate = useCallback(() => setActiveId(null), []);
  const toggle = useCallback(
    (id) => setActiveId((prev) => (prev === id ? null : id)),
    []
  );

  return (
    <section
      aria-label="Meet the EEC team"
      className="pt-20 lg:pt-28 pb-4 relative overflow-hidden"
      style={{
        background: "#F5F3EC",
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent, transparent 159px, rgba(0,0,0,0.06) 159px, rgba(0,0,0,0.06) 160px)",
        backgroundPosition: "0 480px",
      }}
    >
      <div
        className="absolute top-0 left-0 font-display leading-[0.88] text-[#012D76] pointer-events-none select-none"
        style={{ opacity: 0.055 }}
        aria-hidden="true"
      >
        <div style={{ fontSize: "clamp(130px, 19vw, 260px)" }}>our</div>
        <div
          style={{
            fontSize: "clamp(160px, 26vw, 340px)",
            paddingLeft: "clamp(55px, 8vw, 120px)",
          }}
        >
          team
        </div>
      </div>

      <div
        className="relative z-10 team-scroll"
        style={{ paddingLeft: "20px", paddingRight: "20px", paddingTop: "clamp(160px, 22vw, 280px)" }}
      >
        <div
          className="flex gap-4 pb-3 items-start"
          style={{ width: "100%" }}
        >
          {TEAM.map((member) => {
            const isActive = activeId === member.id;
            return (
              <div
                key={member.id}
                className="team-card-slot"
                style={{ marginTop: member.mt }}
              >
                <button
                  type="button"
                  className={`team-card${isActive ? " team-card--active" : ""}`}
                  aria-label={`${member.name}, ${member.role}`}
                  aria-expanded={isActive}
                  onMouseEnter={() => activate(member.id)}
                  onMouseLeave={deactivate}
                  onFocus={() => activate(member.id)}
                  onBlur={deactivate}
                  onClick={() => toggle(member.id)}
                >
                  <div className="team-card__photo">
                    <img
                      src={member.image}
                      alt={`${member.name}, ${member.role}, Elan Exports Consultancy`}
                      width={IMAGE_DIMENSIONS[member.image]?.width}
                      height={IMAGE_DIMENSIONS[member.image]?.height}
                      loading="lazy"
                    />
                  </div>

                  <div className="team-panel" aria-hidden={!isActive}>
                    <div className="team-panel__inner">
                      <div className="team-panel__name font-display">
                        {member.name}
                      </div>
                      <div className="team-panel__role">{member.role}</div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
