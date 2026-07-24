"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const colorMap = {
  primary: "from-primary/20 to-primary/5 text-primary",
  green: "from-green-500/20 to-green-500/5 text-green-600",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-600",
  red: "from-red-500/20 to-red-500/5 text-red-600",
  blue: "from-blue-500/20 to-blue-500/5 text-blue-600",
  purple: "from-purple-500/20 to-purple-500/5 text-purple-600",
} as const;

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
  trend?: number;
  index?: number;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  trend,
  index = 0,
}: StatsCardProps) {
  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden p-5 hover:shadow-lg transition-shadow duration-300">
        <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${c} opacity-50`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c}`}>
              <Icon className="w-5 h-5" />
            </div>
            {trend !== undefined && (
              <span
                className={`text-xs font-medium ${trend > 0 ? "text-green-600" : "text-red-500"}`}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </Card>
    </motion.div>
  );
}
