import "./globals.css";
import { Inter } from "next/font/google";
import { fetchSettingsSS } from "@/components/settings/lib";
import { CUSTOM_ANALYTICS_ENABLED } from "@/lib/constants";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { Metadata } from "next";
import { buildClientUrl } from "@/lib/utilsSS";
import { Toaster } from "@/components/ui/toaster";
import PageSwitcher from "@/components/PageSwitcher";
import { HeaderTitle } from "@/components/header/HeaderTitle";
import { Card } from "@tremor/react";
import Head from "next/head";
import { Logo } from "@/components/Logo";
import { GatingType } from "./admin/settings/interfaces";
import { UserProvider } from "@/components/user/UserProvider";
import { ProviderContextProvider } from "@/components/chat_search/ProviderContext";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const dynamicSettings = await fetchSettingsSS();
  const logoLocation =
    dynamicSettings?.workspaces && dynamicSettings.workspaces?.use_custom_logo
      ? "/api/workspace/logo"
      : buildClientUrl("/enmedd-chp.ico");

  return {
    title: dynamicSettings?.workspaces?.workspace_name || "enMedD AI",
    description:
      dynamicSettings?.workspaces?.workspace_description ||
      "enMedD Conversational Health Platform",
    icons: {
      icon: logoLocation,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const combinedSettings = await fetchSettingsSS();

  const productGating =
    combinedSettings?.settings.product_gating ?? GatingType.NONE;

  if (!combinedSettings) {
    return (
      <html lang="en" className={`${fontSans.variable} font-sans`}>
        <Head>
          <title>Settings Unavailable | Arnold AI</title>
        </Head>
        <body className="bg-background text-default">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="mb-2 flex items-center max-w-[175px]">
              <HeaderTitle>Arnold AI</HeaderTitle>
              <Logo height={40} width={40} />
            </div>

            <Card className="p-8 max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-error">Error</h1>
              <p className="text-text-500">
                Your Arnold AI instance was not configured properly and your
                settings could not be loaded. This could be due to an admin
                configuration issue or an incomplete setup.
              </p>
              <p className="mt-4">
                If you&apos;re an admin, please check{" "}
                <a
                  className="text-link"
                  href="https://docs.danswer.dev/introduction?utm_source=app&utm_medium=error_page&utm_campaign=config_error"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  our docs
                </a>{" "}
                to see how to configure Arnold AI properly. If you&apos;re a
                user, please contact your admin to fix this error.
              </p>
              <p className="mt-4">
                For additional support and guidance, you can reach out to our
                community on{" "}
                <a
                  className="text-link"
                  href="https://danswer.ai?utm_source=app&utm_medium=error_page&utm_campaign=config_error"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Slack
                </a>
                .
              </p>
            </Card>
          </div>
        </body>
      </html>
    );
  }
  // TODO: include this product gating in the future
  // if (productGating === GatingType.FULL) {
  //   return (
  //     <html lang="en" className={`${fontSans.variable} font-sans`}>
  //       <Head>
  //         <title>Access Restricted | Arnold AI</title>
  //       </Head>
  //       <body className="bg-background text-default">
  //         <div className="flex flex-col items-center justify-center min-h-screen">
  //           <div className="mb-2 flex items-center max-w-[175px]">
  //             <HeaderTitle>Arnold AI</HeaderTitle>
  //             <Logo height={40} width={40} />
  //           </div>
  //           <Card className="p-8 max-w-md">
  //             <h1 className="text-2xl font-bold mb-4 text-error">
  //               Access Restricted
  //             </h1>
  //             <p className="text-text-500 mb-4">
  //               We regret to inform you that your access to Arnold AI has been
  //               temporarily suspended due to a lapse in your subscription.
  //             </p>
  //             <p className="text-text-500 mb-4">
  //               To reinstate your access and continue benefiting from
  //               Arnold AI&apos;s powerful features, please update your payment
  //               information.
  //             </p>
  //             <p className="text-text-500">
  //               If you&apos;re an admin, you can resolve this by visiting the
  //               billing section. For other users, please reach out to your
  //               administrator to address this matter.
  //             </p>
  //           </Card>
  //         </div>
  //       </body>
  //     </html>
  //   );
  // }

  return (
    <html lang="en">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, inFitial-scale=1, maximum-scale=1, user-scalable=0, interactive-widget=resizes-content"
        />
      </Head>

      {CUSTOM_ANALYTICS_ENABLED && combinedSettings.customAnalyticsScript && (
        <head>
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: combinedSettings.customAnalyticsScript,
            }}
          />
        </head>
      )}

      <body
        className={`${fontSans.variable} font-sans text-default bg-background ${
          process.env.THEME_IS_DARK?.toLowerCase() === "true" ? "dark" : ""
        }`}
      >
        {/* TODO: include this product gating in the future */}
        {/* {productGating === GatingType.PARTIAL && (
            <div className="fixed top-0 left-0 right-0 z-50 bg-warning-100 text-warning-900 p-2 text-center">
              <p className="text-sm font-medium">
                Your account is pending payment!{" "}
                <a
                  href="/admin/cloud-settings"
                  className="font-bold underline hover:text-warning-700 transition-colors"
                >
                  Update your billing information
                </a>{" "}
                or access will be suspended soon.
              </p>
            </div>
          )} */}
        <UserProvider>
          <ProviderContextProvider>
            <SettingsProvider settings={combinedSettings}>
              {children}
              <Toaster />
              <PageSwitcher />
            </SettingsProvider>
          </ProviderContextProvider>
        </UserProvider>
      </body>
    </html>
  );
}
