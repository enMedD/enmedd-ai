import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="container">
      <div className="mt-12 space-y-2">
        <h1 className="text-center font-bold text-5xl">Choose your plan</h1>
        <p className="text-center text-xl font-semibold">
          Unlock endless possibilities with your workspace
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
        <Card>
          <CardHeader>
            <CardDescription>Arnold AI Basic Plan</CardDescription>
            <CardTitle>€800/Team/Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>
                All Professional features, plus connect to multiple web pages,
                sitemap scraper
              </p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>
                Connect to cloud storage incl. AWS S2, Cloudflare R2, GCP,
                Oracle Cloud
              </p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Supports Custom LLMs</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Data Analysis and Visualization</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Workflow automation</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>API</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Arnold AI Basic Plan</CardDescription>
            <CardTitle>€800/Team/Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>
                All Professional features, plus connect to multiple web pages,
                sitemap scraper
              </p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>
                Connect to cloud storage incl. AWS S2, Cloudflare R2, GCP,
                Oracle Cloud
              </p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Supports Custom LLMs</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Data Analysis and Visualization</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Workflow automation</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>API</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Arnold AI Basic Plan</CardDescription>
            <CardTitle>€800/Team/Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>
                All Professional features, plus connect to multiple web pages,
                sitemap scraper
              </p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>
                Connect to cloud storage incl. AWS S2, Cloudflare R2, GCP,
                Oracle Cloud
              </p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Supports Custom LLMs</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Data Analysis and Visualization</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>Workflow automation</p>
            </div>
            <div className="flex gap-2">
              <Check size={16} className="stroke-success-500 shrink-0 pt-1" />
              <p>API</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-10">
        <Link href="/discovery-choose-plan">
          <Button>Proceed to Payment</Button>
        </Link>
      </div>
    </div>
  );
}
