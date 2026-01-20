import { useEffect, useState } from "react";
import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen";
import Layout from "./components/Layout/Layout";

export default function App() {
  const [markdownFolderPath, setMarkdownFolderPath] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load config from localStorage on mount
    const saved = localStorage.getItem("mdreader_config");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        // Notify server of the saved folder path
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        }).then(() => {
          setMarkdownFolderPath(config.markdownFolderPath);
          setLoading(false);
        }).catch((error) => {
          console.error("Failed to configure server:", error);
          setLoading(false);
        });
      } catch (e) {
        console.error("Failed to parse config:", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleFolderSelected = async (path: string) => {
    try {
      // Save to localStorage
      const config = { markdownFolderPath: path };
      localStorage.setItem("mdreader_config", JSON.stringify(config));

      // Notify server of folder selection
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      setMarkdownFolderPath(path);
    } catch (error) {
      console.error("Failed to set folder:", error);
      alert("Failed to set markdown folder. Please try again.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!markdownFolderPath) {
    return <WelcomeScreen onFolderSelected={handleFolderSelected} />;
  }

  return <Layout folderPath={markdownFolderPath} />;
}
