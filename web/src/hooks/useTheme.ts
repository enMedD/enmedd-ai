import { useEffect } from "react";

const defaultTheme = {
  brand: {
    50: "#f7d6ff",
    100: "#F0B3FF",
    200: "#E066FF",
    300: "#D11AFF",
    400: "#A300CC",
    500: "#65007E",
    600: "#520066",
    700: "#3D004D",
    800: "#290033",
    900: "#140019",
    950: "#08000A",
  },
  secondary: {
    50: "#FDF5FF",
    100: "#FCF0FF",
    200: "#F8E1FF",
    300: "#F5D2FE",
    400: "#F1C3FE",
    500: "#EEB3FE",
    600: "#DA5EFD",
    700: "#C708FC",
    800: "#8702AB",
    900: "#430156",
    950: "#200128",
  },
};

const loadingColor = "#e7e7e7";

export function useTheme() {
  useEffect(() => {
    applyLoadingColors();

    async function fetchAndApplyTheme() {
      try {
        const response = await fetch("/api/themes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch theme");
        }

        const themeData = await response.json();
        applyThemeToCSSVariables(themeData);
      } catch (error) {
        console.error("Error fetching theme:", error);
        applyThemeToCSSVariables(defaultTheme);
      }
    }

    fetchAndApplyTheme();
  }, []);

  function applyLoadingColors() {
    const keys = [
      "50",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
      "950",
    ];
    keys.forEach((key) => {
      document.documentElement.style.setProperty(
        `--brand-${key}`,
        loadingColor
      );
      document.documentElement.style.setProperty(
        `--secondary-${key}`,
        loadingColor
      );
    });
  }

  function applyThemeToCSSVariables(themeData: any) {
    const { brand, secondary } = themeData;

    Object.keys(brand).forEach((key) => {
      const color = brand[key];
      document.documentElement.style.setProperty(`--brand-${key}`, color);
    });

    Object.keys(secondary).forEach((key) => {
      const color = secondary[key];
      document.documentElement.style.setProperty(`--secondary-${key}`, color);
    });
  }
}
