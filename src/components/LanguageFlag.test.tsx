import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageFlag, getLanguageFlagString } from "./LanguageFlag";

describe("LanguageFlag", () => {
  describe("getLanguageFlagString", () => {
    it("returns lion emoji for Persian/fa/farsi", () => {
      expect(getLanguageFlagString("persian")).toBe("🦁");
      expect(getLanguageFlagString("Persian")).toBe("🦁");
      expect(getLanguageFlagString("fa")).toBe("🦁");
      expect(getLanguageFlagString("farsi")).toBe("🦁");
    });

    it("returns correct emoji for Korean", () => {
      expect(getLanguageFlagString("korean")).toBe("🇰🇷");
      expect(getLanguageFlagString("ko")).toBe("🇰🇷");
    });

    it("returns correct emoji for Arabic", () => {
      expect(getLanguageFlagString("arabic")).toBe("🇸🇦");
      expect(getLanguageFlagString("ar")).toBe("🇸🇦");
    });

    it("returns correct emoji for Hebrew", () => {
      expect(getLanguageFlagString("hebrew")).toBe("🇮🇱");
      expect(getLanguageFlagString("he")).toBe("🇮🇱");
    });

    it("returns correct emoji for Japanese", () => {
      expect(getLanguageFlagString("japanese")).toBe("🇯🇵");
      expect(getLanguageFlagString("ja")).toBe("🇯🇵");
    });

    it("returns correct emoji for Chinese", () => {
      expect(getLanguageFlagString("chinese")).toBe("🇨🇳");
      expect(getLanguageFlagString("zh")).toBe("🇨🇳");
    });

    it("returns globe emoji for unknown languages", () => {
      expect(getLanguageFlagString("unknown")).toBe("🌍");
      expect(getLanguageFlagString("xyz")).toBe("🌍");
    });
  });

  describe("LanguageFlag component", () => {
    it("renders an img tag for Persian", () => {
      render(<LanguageFlag language="persian" />);
      const img = screen.getByAltText("Persian");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/flags/iran-lion.svg");
    });

    it("renders emoji span for non-Persian languages", () => {
      render(<LanguageFlag language="korean" />);
      const span = screen.getByText("🇰🇷");
      expect(span).toBeInTheDocument();
    });

    it("applies custom size via style attribute", () => {
      render(<LanguageFlag language="persian" size="2em" />);
      const img = screen.getByAltText("Persian");
      // Check the style attribute directly since computed styles convert to px
      expect(img.getAttribute("style")).toContain("width: 2em");
      expect(img.getAttribute("style")).toContain("height: 2em");
    });

    it("applies custom className", () => {
      render(<LanguageFlag language="korean" className="test-class" />);
      const span = screen.getByText("🇰🇷");
      expect(span).toHaveClass("test-class");
    });
  });
});
