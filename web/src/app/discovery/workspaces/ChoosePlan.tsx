import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    title: "Free Plan",
    description: "Ideal for growing businesses and larger teams",
    price: 0,
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
    title: "Pro Plan",
    description: "Ideal for growing businesses and larger teams",
    price: 29.99,
    features: [
      "Includes Basic Plan features",
      "Advanced analytics and reporting",
      "Priority support",
      "Custom integrations",
      "Unlimited users",
    ],
  },
  {
    title: "Enterprise Plan",
    description: "Ideal for growing businesses and larger teams",
    price: 99.99,
    features: [
      "Includes Professional Plan features",
      "Dedicated account manager",
      "On-premise deployment",
      "Enhanced security features",
      "Custom LLM development",
    ],
  },
];

export default function ChoosePlan({ onCancel }: { onCancel: () => void }) {
  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:border-brand-500 flex flex-col justify-between"
          >
            <CardHeader>
              <CardTitle className="text-dark-900 font-normal">
                {plan.title}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <h3 className="pb-2 text-3xl text-dark-900">
                ${plan.price} /{" "}
                <span className="text-sm font-normal">month</span>
              </h3>
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex gap-2">
                  <Check
                    size={20}
                    className="stroke-success-500 shrink-0 pt-1"
                  />
                  <p>{feature}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter className="mt-auto">
              <Button variant="outline" className="w-full">
                Select Plan
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-10 gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Link href="/discovery/payment-successful">
          <Button>Proceed with Selected Plan</Button>
        </Link>
      </div>
    </div>
  );
}
