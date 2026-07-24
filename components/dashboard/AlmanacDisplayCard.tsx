import { CalendarDays, Download, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SerializedAlmanac } from "@/lib/serializers";

interface AlmanacDisplayCardProps {
  almanac: SerializedAlmanac | null;
}

function CrestMark({ className = "w-28 h-28" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-primary/15 blur-2xl rounded-full" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="ALMANAC"
        className="relative w-full h-full object-contain drop-shadow-xl rounded-xl ring-1 ring-black/10 bg-black"
      />
    </div>
  );
}

export default function AlmanacDisplayCard({ almanac }: AlmanacDisplayCardProps) {
  if (!almanac) {
    return (
      <Card className="overflow-hidden border border-dashed">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <CrestMark className="w-20 h-20 sm:w-24 sm:h-24 opacity-80" />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold mb-3 uppercase tracking-widest">
                <CalendarDays className="w-3.5 h-3.5" /> Official Calendar
              </div>
              <h3 className="text-xl font-bold mb-2">No active almanac yet</h3>
              <p className="text-muted-foreground max-w-md">
                Upload an official academic calendar PDF from the admin panel to show
                it here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm ring-1 ring-primary/20">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="p-6 sm:p-8 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 uppercase tracking-widest">
              <CalendarDays className="w-3.5 h-3.5" /> Official Calendar
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground break-words">
              {almanac.title}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md break-words">
              {almanac.description ||
                `The complete academic calendar for the ${almanac.year} year.`}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <Button asChild className="gap-2 shadow-md w-full sm:w-auto">
                <a
                  href={`/api/almanac/${almanac.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Eye className="w-4 h-4" /> View Almanac
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2 bg-background/50 backdrop-blur-sm w-full sm:w-auto"
              >
                <a
                  href={`/api/almanac/${almanac.id}/download`}
                  download={almanac.file_name}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              </Button>
            </div>
          </div>
          <div className="flex p-6 sm:p-8 justify-center items-center">
            <CrestMark className="w-28 h-28 sm:w-36 sm:h-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
