"use client";

import { RegistrationStats } from "@/lib/supabase/admin";
import { Users, UserCheck, CheckCircle2, Clock, IndianRupee } from "lucide-react";

interface AdminStatsProps {
  stats: RegistrationStats;
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: "TOTAL TEAMS",
      value: stats.totalTeams.toLocaleString("en-IN"),
      subtext: "Registered Squads",
      icon: Users,
      valueColor: "text-white",
      borderColor: "border-neutral-800/80 hover:border-amber-500/30",
      badgeColor: "bg-neutral-900 text-neutral-300 border border-neutral-800",
    },
    {
      title: "TOTAL MEMBERS",
      value: stats.totalMembers.toLocaleString("en-IN"),
      subtext: "Participants In Roster",
      icon: UserCheck,
      valueColor: "text-neutral-200",
      borderColor: "border-neutral-800/80 hover:border-amber-500/30",
      badgeColor: "bg-neutral-900 text-neutral-300 border border-neutral-800",
    },
    {
      title: "PAID",
      value: stats.paidCount.toLocaleString("en-IN"),
      subtext: "Verified Successful Payments",
      icon: CheckCircle2,
      valueColor: "text-emerald-400",
      borderColor: "border-emerald-950/50 hover:border-emerald-500/40",
      badgeColor: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30",
    },
    {
      title: "PENDING",
      value: stats.pendingCount.toLocaleString("en-IN"),
      subtext: "Awaiting Payment Verification",
      icon: Clock,
      valueColor: "text-amber-400",
      borderColor: "border-amber-950/50 hover:border-amber-500/40",
      badgeColor: "bg-amber-950/40 text-amber-400 border border-amber-500/30",
    },
    {
      title: "TOTAL COLLECTED",
      value: `₹${stats.totalCollected.toLocaleString("en-IN")}`,
      subtext: "Verified payments only",
      icon: IndianRupee,
      valueColor: "text-amber-300 font-extrabold",
      borderColor: "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.06)]",
      badgeColor: "bg-amber-500/10 text-amber-300 border border-amber-500/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        const isWideOnMobile = idx === statCards.length - 1; // TOTAL COLLECTED card spans full width on 2-col layout
        return (
          <div
            key={card.title}
            className={`bg-[#12100d] border ${card.borderColor} rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
              isWideOnMobile ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono text-xs tracking-widest text-neutral-300 uppercase font-semibold">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-md ${card.badgeColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${card.valueColor}`}>
                {card.value}
              </div>
              <p className="font-mono text-xs text-neutral-300 mt-1 truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
