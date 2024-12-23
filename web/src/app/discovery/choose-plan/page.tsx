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

const plans = [
  {
    description: "Arnold AI Basic Plan",
    title: "€800/Team/Month",
    features: [
      "All Professional features, plus connect to multiple web pages, sitemap scraper",
      "Connect to cloud storage incl. AWS S2, Cloudflare R2, GCP, Oracle Cloud",
      "Supports Custom LLMs",
      "Data Analysis and Visualization",
      "Workflow automation",
      "API",
    ],
  },
  {
    description: "Arnold AI Professional Plan",
    title: "€1,200/Team/Month",
    features: [
      "Includes Basic Plan features",
      "Advanced analytics and reporting",
      "Priority support",
      "Custom integrations",
      "Unlimited users",
    ],
  },
  {
    description: "Arnold AI Enterprise Plan",
    title: "€2,500/Team/Month",
    features: [
      "Includes Professional Plan features",
      "Dedicated account manager",
      "On-premise deployment",
      "Enhanced security features",
      "Custom LLM development",
    ],
  },
];

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
        {plans.map((plan, index) => (
          <Card key={index} className="cursor-pointer hover:border-brand-500">
            <CardHeader>
              <CardDescription>{plan.description}</CardDescription>
              <CardTitle>{plan.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex gap-2">
                  <Check
                    size={16}
                    className="stroke-success-500 shrink-0 pt-1"
                  />
                  <p>{feature}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-10">
        <Link href="/discovery/payment-successful">
          <Button>Proceed to Payment</Button>
        </Link>
      </div>
    </div>
  );
}
