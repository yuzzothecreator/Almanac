import { CalendarDays, Download, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockAlmanac } from "@/data/mock";

export default function AlmanacDisplayCard() {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm ring-1 ring-primary/20">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="p-6 sm:p-8 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-4 uppercase tracking-widest">
              <CalendarDays className="w-3.5 h-3.5" /> Official Calendar
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
              {mockAlmanac.title}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">{mockAlmanac.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button className="gap-2 shadow-md">
                <Eye className="w-4 h-4" /> View Almanac
              </Button>
              <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>
          </div>
          <div className="hidden sm:flex p-8 justify-center items-center opacity-80">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <FileText className="w-32 h-32 text-primary drop-shadow-xl" strokeWidth={1} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
