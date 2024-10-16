import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Database, Globe, User } from "lucide-react";

export default function Usage() {
  return (
    <div className="mt-8 w-full">
      <div>
        <h2 className="font-bold text:lg md:text-xl">Usage</h2>
        <p className="text-sm">
          Tracks and manages how tools and resources are used within the
          workspace, ensuring efficient operation and consistent performance for
          all users
        </p>
      </div>

      <div className="w-full grid grid-cols-2 gap-6 mt-8">
        <Card>
          <CardContent className="space-y-4">
            <div className="bg-secondary-foreground inline-block p-2 rounded-sm">
              <Database className="stroke-secondary" />
            </div>
            <div>
              <h3>Embedding Storage</h3>
              <span className="text-sm text-subtle">2323 items</span>
            </div>
            <Slider disabled />

            <p className="text-sm text-subtle font-medium">20 GB 0f 300 GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="bg-primary-foreground inline-block p-2 rounded-sm">
              <Globe className="stroke-primary" />
            </div>
            <div>
              <h3>Embedding Storage</h3>
              <span className="text-sm text-subtle">2323 items</span>
            </div>
            <Slider disabled />
            <p className="text-sm text-subtle font-medium">20 GB 0f 300 GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="bg-success-foreground inline-block p-2 rounded-sm">
              <User className="stroke-success" />
            </div>
            <div>
              <h3>Embedding Storage</h3>
              <span className="text-sm text-subtle">2323 items</span>
            </div>
            <Slider disabled />
            <p className="text-sm text-subtle font-medium">20 GB 0f 300 GB</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
